/**
 * Admin Router
 * 
 * Admin-only procedures for user management and system administration
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, adminProcedure } from "../trpc";
import { UserRole } from "@/lib/auth";

const updateUserRoleSchema = z.object({
  userId: z.string(),
  role: z.nativeEnum(UserRole),
});

const updateUserAdminSchema = z.object({
  userId: z.string(),
  isAdmin: z.boolean(),
});

const getUserSchema = z.object({
  userId: z.string(),
});

const listUsersSchema = z.object({
  limit: z.number().int().positive().max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  search: z.string().optional(),
});

export const adminRouter = createTRPCRouter({
  /**
   * Get all users (admin only)
   */
  listUsers: adminProcedure
    .input(listUsersSchema)
    .query(async ({ ctx, input }) => {
      const where = input.search
        ? {
            OR: [
              { email: { contains: input.search, mode: "insensitive" as const } },
              { name: { contains: input.search, mode: "insensitive" as const } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            image: true,
            role: true,
            isAdmin: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                projects: true,
                brandKits: true,
                subscriptions: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.db.user.count({ where }),
      ]);

      return {
        users,
        total,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  /**
   * Get user by ID (admin only)
   */
  getUser: adminProcedure
    .input(getUserSchema)
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          image: true,
          role: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              projects: true,
              brandKits: true,
              subscriptions: true,
              credits: true,
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
   * Update user role (admin only)
   */
  updateUserRole: adminProcedure
    .input(updateUserRoleSchema)
    .mutation(async ({ ctx, input }) => {
      // Prevent admins from removing their own admin status
      if (input.userId === ctx.session.user.id && input.role !== UserRole.admin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot remove your own admin role",
        });
      }

      const user = await ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isAdmin: true,
        },
      });

      return user;
    }),

  /**
   * Update user admin status (admin only)
   */
  updateUserAdmin: adminProcedure
    .input(updateUserAdminSchema)
    .mutation(async ({ ctx, input }) => {
      // Prevent admins from removing their own admin status
      if (input.userId === ctx.session.user.id && !input.isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot remove your own admin privileges",
        });
      }

      const user = await ctx.db.user.update({
        where: { id: input.userId },
        data: { isAdmin: input.isAdmin },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isAdmin: true,
        },
      });

      return user;
    }),

  /**
   * Get system statistics (admin only)
   */
  getStats: adminProcedure.query(async ({ ctx }) => {
    const [
      totalUsers,
      totalProjects,
      totalBrandKits,
      totalSubscriptions,
      activeSubscriptions,
      totalCredits,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.project.count(),
      ctx.db.brandKit.count(),
      ctx.db.subscription.count(),
      ctx.db.subscription.count({
        where: {
          status: "ACTIVE",
        },
      }),
      ctx.db.creditTransaction.aggregate({
        _sum: {
          amount: true,
        },
      }),
    ]);

    return {
      totalUsers,
      totalProjects,
      totalBrandKits,
      totalSubscriptions,
      activeSubscriptions,
      totalCredits: totalCredits._sum.amount || 0,
    };
  }),
});

