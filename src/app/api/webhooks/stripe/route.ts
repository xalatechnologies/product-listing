/**
 * Stripe Webhook Handler (Next.js API Route)
 *
 * This route receives webhooks from Stripe and forwards them to the Supabase Edge Function.
 * Alternatively, you can handle webhooks directly here.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-10-29.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan as string;
  const credits = session.metadata?.credits;

  if (!userId) {
    console.error("No userId in checkout session metadata");
    return;
  }

  // Handle credit purchase
  if (credits) {
    await prisma.creditTransaction.create({
      data: {
        userId,
        amount: parseInt(credits, 10),
        type: "PURCHASE",
        description: `Credit purchase via Stripe`,
        metadata: {
          sessionId: session.id,
        },
      },
    });
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const stripeId = subscription.id;
  const status = subscription.status;
  const plan = mapStripePriceToPlan(subscription.items.data[0]?.price.id);

  // Get customer email
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return;

  const email = (customer as Stripe.Customer).email;
  if (!email) return;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error("User not found for customer:", customerId);
    return;
  }

  // Update or create subscription
  // Access subscription period dates (Stripe uses snake_case in API responses)
  const periodStart = (subscription as any).current_period_start
    ? new Date((subscription as any).current_period_start * 1000)
    : new Date();
  const periodEnd = (subscription as any).current_period_end
    ? new Date((subscription as any).current_period_end * 1000)
    : new Date();

  await prisma.subscription.upsert({
    where: { stripeId },
    update: {
      plan: plan as any,
      status: mapStripeStatus(status) as any,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
    create: {
      userId: user.id,
      stripeId,
      plan: plan as any,
      status: mapStripeStatus(status) as any,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
    },
  });

  // Add subscription credits if new subscription
  if (status === "active" || status === "trialing") {
    const existingSubscription = await prisma.subscription.findUnique({
      where: { stripeId },
    });

    // Only add credits if this is a new subscription or period just started
    if (!existingSubscription || isNewPeriod(existingSubscription.currentPeriodStart)) {
      await addSubscriptionCredits(user.id, plan);
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const stripeId = subscription.id;

  await prisma.subscription.updateMany({
    where: { stripeId },
    data: {
      status: "CANCELED",
      cancelAtPeriodEnd: false,
    },
  });
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Invoice.subscription can be a string ID or a Subscription object
  const subscriptionId =
    typeof (invoice as any).subscription === "string"
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id;
  if (!subscriptionId) return;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await handleSubscriptionUpdate(subscription);
}

async function addSubscriptionCredits(userId: string, plan: string) {
  const creditAmounts: Record<string, number> = {
    STARTER: 10,
    PROFESSIONAL: 50,
    AGENCY: 999999,
  };

  const amount = creditAmounts[plan] || 0;
  if (amount === 0) return;

  await prisma.creditTransaction.create({
    data: {
      userId,
      amount,
      type: "SUBSCRIPTION",
      description: `Monthly subscription credits for ${plan} plan`,
    },
  });
}

function mapStripePriceToPlan(priceId: string | undefined): string {
  if (!priceId) return "FREE";

  const priceToPlan: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER || ""]: "STARTER",
    [process.env.STRIPE_PRICE_PROFESSIONAL || ""]: "PROFESSIONAL",
    [process.env.STRIPE_PRICE_AGENCY || ""]: "AGENCY",
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

function isNewPeriod(periodStart: Date): boolean {
  const now = new Date();
  const periodStartTime = periodStart.getTime();
  const oneDayAgo = now.getTime() - 24 * 60 * 60 * 1000;
  return periodStartTime > oneDayAgo;
}

