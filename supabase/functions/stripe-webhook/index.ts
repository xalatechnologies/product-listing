/**
 * Stripe Webhook Handler for Supabase Edge Function
 *
 * Handles Stripe webhook events:
 * - subscription.created
 * - subscription.updated
 * - subscription.deleted
 * - payment_intent.succeeded
 * - customer.subscription.updated
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

import { corsHeaders, handleCors } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Verify webhook signature
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Webhook signature verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(supabase, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

async function handleSubscriptionUpdate(
  supabase: any,
  subscription: Stripe.Subscription,
) {
  const customerId = subscription.customer as string;
  const stripeId = subscription.id;
  const status = subscription.status;
  const plan = mapStripePriceToPlan(subscription.items.data[0]?.price.id);

  // Find user by Stripe customer ID
  const { data: existingSubscription } = await supabase
    .from("Subscription")
    .select("userId")
    .eq("stripeId", stripeId)
    .single();

  if (!existingSubscription) {
    // Find user by email from Stripe customer
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return;

    const email = (customer as Stripe.Customer).email;
    if (!email) return;

    const { data: user } = await supabase
      .from("User")
      .select("id")
      .eq("email", email)
      .single();

    if (!user) {
      console.error("User not found for customer:", customerId);
      return;
    }

    // Create subscription
    await supabase.from("Subscription").insert({
      userId: user.id,
      stripeId,
      plan,
      status: mapStripeStatus(status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    });

    // Add subscription credits
    await addSubscriptionCredits(supabase, user.id, plan);
  } else {
    // Update existing subscription
    await supabase
      .from("Subscription")
      .update({
        plan,
        status: mapStripeStatus(status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      })
      .eq("stripeId", stripeId);
  }
}

async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription,
) {
  const stripeId = subscription.id;

  await supabase
    .from("Subscription")
    .update({
      status: "CANCELED",
      cancelAtPeriodEnd: false,
    })
    .eq("stripeId", stripeId);
}

async function handleCheckoutCompleted(
  supabase: any,
  session: Stripe.Checkout.Session,
) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await handleSubscriptionUpdate(supabase, subscription);
  }
}

async function handlePaymentSucceeded(
  supabase: any,
  invoice: Stripe.Invoice,
) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionUpdate(supabase, subscription);
}

async function handlePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice,
) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  await supabase
    .from("Subscription")
    .update({ status: "PAST_DUE" })
    .eq("stripeId", subscriptionId);
}

async function addSubscriptionCredits(
  supabase: any,
  userId: string,
  plan: string,
) {
  const creditAmounts: Record<string, number> = {
    STARTER: 10,
    PROFESSIONAL: 50,
    AGENCY: 999999, // Unlimited
  };

  const amount = creditAmounts[plan] || 0;
  if (amount === 0) return;

  await supabase.from("CreditTransaction").insert({
    userId,
    amount,
    type: "SUBSCRIPTION",
    description: `Monthly subscription credits for ${plan} plan`,
  });
}

function mapStripePriceToPlan(priceId: string | undefined): string {
  if (!priceId) return "FREE";

  // Map your Stripe price IDs to subscription plans
  const priceToPlan: Record<string, string> = {
    [Deno.env.get("STRIPE_PRICE_STARTER") || ""]: "STARTER",
    [Deno.env.get("STRIPE_PRICE_PROFESSIONAL") || ""]: "PROFESSIONAL",
    [Deno.env.get("STRIPE_PRICE_AGENCY") || ""]: "AGENCY",
  };

  return priceToPlan[priceId] || "FREE";
}

function mapStripeStatus(status: string): string {
  const statusMap: Record<string, string> = {
    active: "ACTIVE",
    canceled: "CANCELED",
    past_due: "PAST_DUE",
    trialing: "TRIALING",
    incomplete: "PAST_DUE",
    incomplete_expired: "CANCELED",
    unpaid: "PAST_DUE",
  };

  return statusMap[status] || "ACTIVE";
}

