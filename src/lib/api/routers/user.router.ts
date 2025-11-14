/**
 * User router for managing user profile and account settings.
 *
 * Handles:
 * - Getting user profile
 * - Updating user profile (name, email, image)
 * - Managing connected accounts
 * - Account deletion
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { prisma } from "@/lib/db";

export const userRouter = createTRPCRouter({
  /**
   * Get current user profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await ctx.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          select: {
            id: true,
            provider: true,
            type: true,
          },
        },
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  /**
   * Update user profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100).optional(),
        email: z.string().email().optional(),
        image: z.string().url().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Check if email is being changed and if it's already taken
      if (input.email) {
        const existingUser = await ctx.db.user.findFirst({
          where: {
            email: input.email,
            id: { not: userId },
          },
        });

        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email is already in use",
          });
        }
      }

      const updatedUser = await ctx.db.user.update({
        where: { id: userId },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.email && { email: input.email, emailVerified: null }), // Reset verification if email changes
          ...(input.image !== undefined && { image: input.image }),
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          emailVerified: true,
        },
      });

      return updatedUser;
    }),

  /**
   * Get connected accounts (OAuth providers)
   */
  getConnectedAccounts: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const accounts = await ctx.db.account.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        type: true,
        providerAccountId: true,
      },
    });

    return accounts;
  }),

  /**
   * Delete connected account (OAuth provider)
   */
  deleteConnectedAccount: protectedProcedure
    .input(z.object({ accountId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify the account belongs to the user
      const account = await ctx.db.account.findFirst({
        where: {
          id: input.accountId,
          userId,
        },
      });

      if (!account) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Account not found",
        });
      }

      // Don't allow deleting the last account if user has no password
      const user = await ctx.db.user.findUnique({
        where: { id: userId },
        include: {
          accounts: true,
        },
      });

      if (user && user.accounts.length === 1 && !user.hashedPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete the last connected account. Please set a password first.",
        });
      }

      await ctx.db.account.delete({
        where: { id: input.accountId },
      });

      return { success: true };
    }),

  /**
   * Delete user account
   */
  deleteAccount: protectedProcedure
    .input(
      z.object({
        confirm: z.literal(true),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!input.confirm) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Account deletion must be confirmed",
        });
      }

      const userId = ctx.session.user.id;

      // Delete user (cascade will handle related records)
      await ctx.db.user.delete({
        where: { id: userId },
      });

      return { success: true };
    }),
});

