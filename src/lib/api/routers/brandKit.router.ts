/**
 * Brand Kit router for managing brand identity systems.
 *
 * Handles CRUD operations for brand kits, including:
 * - Creating brand kits
 * - Listing user's brand kits
 * - Updating brand kits
 * - Deleting brand kits
 * - Setting default brand kit
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const brandKitSchema = z.object({
  name: z.string().min(1).max(255),
  logoUrl: z.string().url().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  fontFamily: z.string().optional(),
});

const updateBrandKitSchema = brandKitSchema.partial().extend({
  id: z.string(),
});

export const brandKitRouter = createTRPCRouter({
  /**
   * Create a new brand kit
   */
  create: protectedProcedure
    .input(brandKitSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const brandKit = await ctx.db.brandKit.create({
        data: {
          userId,
          ...input,
          isDefault: false,
        },
      });

      return brandKit;
    }),

  /**
   * List all brand kits for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const brandKits = await ctx.db.brandKit.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return brandKits;
  }),

  /**
   * Get a single brand kit by ID
   */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const brandKit = await ctx.db.brandKit.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!brandKit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand kit not found",
        });
      }

      return brandKit;
    }),

  /**
   * Update a brand kit
   */
  update: protectedProcedure
    .input(updateBrandKitSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { id, ...data } = input;

      // Verify brand kit belongs to user
      const existing = await ctx.db.brandKit.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand kit not found",
        });
      }

      const brandKit = await ctx.db.brandKit.update({
        where: { id },
        data,
      });

      return brandKit;
    }),

  /**
   * Delete a brand kit
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify brand kit belongs to user
      const existing = await ctx.db.brandKit.findFirst({
        where: { id: input.id, userId },
        include: {
          projects: {
            select: { id: true },
          },
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand kit not found",
        });
      }

      // Optional: Check if brand kit is used by projects
      // For now, we allow deletion even if in use (cascade will handle projects)

      // Delete logo file from Supabase Storage
      if (existing.logoUrl) {
        try {
          const { extractPathFromUrl, deleteFile } = await import("@/lib/storage");
          const path = extractPathFromUrl(existing.logoUrl);
          await deleteFile("brand-kits", path);
        } catch (error) {
          // Log error but don't fail deletion if storage deletion fails
          console.error("Failed to delete logo from storage:", error);
        }
      }

      await ctx.db.brandKit.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Set a brand kit as default
   */
  setDefault: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify brand kit belongs to user
      const brandKit = await ctx.db.brandKit.findFirst({
        where: { id: input.id, userId },
      });

      if (!brandKit) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Brand kit not found",
        });
      }

      // Set all user's brand kits to isDefault = false
      await ctx.db.brandKit.updateMany({
        where: { userId },
        data: { isDefault: false },
      });

      // Set selected brand kit to isDefault = true
      const updated = await ctx.db.brandKit.update({
        where: { id: input.id },
        data: { isDefault: true },
      });

      return updated;
    }),
});

