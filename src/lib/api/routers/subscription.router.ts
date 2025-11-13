/**
 * Subscription router for managing billing and subscriptions.
 *
 * Handles:
 * - Getting subscription status
 * - Managing subscription plans
 * - Credit balance and usage
 * - Stripe checkout session creation
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { SubscriptionPlan } from "@prisma/client";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-10-29.clover",
});

// Map subscription plans to Stripe price IDs
const PLAN_PRICE_IDS: Record<SubscriptionPlan, string> = {
  FREE: "",
  STARTER: process.env.STRIPE_PRICE_STARTER || "",
  PROFESSIONAL: process.env.STRIPE_PRICE_PROFESSIONAL || "",
  AGENCY: process.env.STRIPE_PRICE_AGENCY || "",
};

// Credit amounts per plan per month
const PLAN_CREDITS: Record<SubscriptionPlan, number> = {
  FREE: 0,
  STARTER: 10,
  PROFESSIONAL: 50,
  AGENCY: 999999, // Unlimited
};

export const subscriptionRouter = createTRPCRouter({
  /**
   * Get current subscription status
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const subscription = await ctx.db.subscription.findFirst({
      where: {
        userId,
        status: {
          in: ["ACTIVE", "TRIALING"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return subscription;
  }),

  /**
   * Get credit balance
   */
  getCredits: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Calculate balance from transactions
    const result = await ctx.db.creditTransaction.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    return {
      balance: result._sum.amount || 0,
    };
  }),

  /**
   * Get credit usage history
   */
  getCreditHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const transactions = await ctx.db.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        skip: input.offset,
      });

      const total = await ctx.db.creditTransaction.count({
        where: { userId },
      });

      return {
        transactions,
        total,
      };
    }),

  /**
   * Create checkout session for subscription
   */
  createCheckout: protectedProcedure
    .input(z.object({ plan: z.nativeEnum(SubscriptionPlan) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userEmail = ctx.session.user.email;

      if (!userEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User email is required to create a subscription",
        });
      }

      const priceId = PLAN_PRICE_IDS[input.plan];
      if (!priceId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Subscription plan "${input.plan}" is not properly configured. Please contact support.`,
        });
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        customer_email: userEmail,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
        metadata: {
          userId,
          plan: input.plan,
        },
        subscription_data: {
          metadata: {
            userId,
            plan: input.plan,
          },
        },
      });

      return {
        url: session.url,
        sessionId: session.id,
      };
    }),

  /**
   * Create checkout session for one-time credit purchase
   */
  purchaseCredits: protectedProcedure
    .input(
      z.object({
        amount: z.number().int().positive(),
        priceId: z.string(), // Stripe price ID for credit pack
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userEmail = ctx.session.user.email;

      if (!userEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User email is required to purchase credits",
        });
      }

      const session = await stripe.checkout.sessions.create({
        customer_email: userEmail,
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price: input.priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXTAUTH_URL}/dashboard?credits=true`,
        cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
        metadata: {
          userId,
          credits: input.amount.toString(),
          type: "credit_purchase",
        },
      });

      return {
        url: session.url,
        sessionId: session.id,
      };
    }),

  /**
   * Cancel subscription
   */
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const subscription = await ctx.db.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
    });

    if (!subscription || !subscription.stripeId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No active subscription found. Please subscribe to a plan first.",
      });
    }

    // Cancel at period end
    await stripe.subscriptions.update(subscription.stripeId, {
      cancel_at_period_end: true,
    });

    // Update database
    await ctx.db.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });

    return { success: true };
  }),

  /**
   * Resume canceled subscription
   */
  resume: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const subscription = await ctx.db.subscription.findFirst({
      where: {
        userId,
        status: "CANCELED",
        cancelAtPeriodEnd: true,
      },
    });

    if (!subscription || !subscription.stripeId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No canceled subscription found to resume.",
      });
    }

    // Resume subscription
    await stripe.subscriptions.update(subscription.stripeId, {
      cancel_at_period_end: false,
    });

    // Update database
    await ctx.db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "ACTIVE",
        cancelAtPeriodEnd: false,
      },
    });

    return { success: true };
  }),

  /**
   * Check if user has enough credits for an operation
   */
  checkCredits: protectedProcedure
    .input(z.object({ required: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const result = await ctx.db.creditTransaction.aggregate({
        where: { userId },
        _sum: { amount: true },
      });

      const balance = result._sum.amount || 0;
      const hasEnough = balance >= input.required;

      return {
        hasEnough,
        balance,
        required: input.required,
      };
    }),

  /**
   * Deduct credits for an operation
   */
  deductCredits: protectedProcedure
    .input(
      z.object({
        amount: z.number().int().positive(),
        description: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check balance first
      const result = await ctx.db.creditTransaction.aggregate({
        where: { userId },
        _sum: { amount: true },
      });

      const balance = result._sum.amount || 0;
      if (balance < input.amount) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Insufficient credits. You have ${balance} credits but need ${input.amount}. Please purchase more credits.`,
        });
      }

      // Deduct credits
      await ctx.db.creditTransaction.create({
        data: {
          userId,
          amount: -input.amount,
          type: "USAGE",
          description: input.description || "Credit usage",
          metadata: input.metadata,
        },
      });

      return {
        success: true,
        newBalance: balance - input.amount,
      };
    }),
});
