/**
 * Subscription router for managing billing and subscriptions.
 *
 * Handles:
 * - Getting subscription status
 * - Managing subscription plans
 * - Credit balance and usage
 * - Stripe webhook integration (separate endpoint)
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { SubscriptionPlan } from "@prisma/client";

export const subscriptionRouter = createTRPCRouter({
  /**
   * Get current subscription status
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // TODO: Implement subscription retrieval after Prisma client is generated
    throw new Error("Not implemented: Prisma client needs to be generated");
  }),

  /**
   * Get credit balance
   */
  getCredits: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // TODO: Calculate credit balance from CreditTransaction records
    throw new Error("Not implemented: Prisma client needs to be generated");
  }),

  /**
   * Create checkout session for subscription
   */
  createCheckout: protectedProcedure
    .input(z.object({ plan: z.nativeEnum(SubscriptionPlan) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // TODO: Create Stripe checkout session
      throw new Error("Not implemented: Stripe integration needed");
    }),

  /**
   * Cancel subscription
   */
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // TODO: Cancel Stripe subscription
    throw new Error("Not implemented: Stripe integration needed");
  }),
});

