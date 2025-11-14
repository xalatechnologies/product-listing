/**
 * Image router for managing product images and AI-generated images.
 *
 * Handles:
 * - Uploading product images
 * - Generating listing images
 * - Listing generated images
 * - Downloading image packs
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { ImageType, CreditType } from "@prisma/client";
import { getCreditsRequiredForImage } from "@/lib/utils/credits";

const uploadImageSchema = z.object({
  projectId: z.string(),
  url: z.string().url(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  size: z.number().int().positive(),
  order: z.number().int().default(0),
});

const generateImageSchema = z.object({
  projectId: z.string(),
  type: z.nativeEnum(ImageType),
  style: z.string().optional(),
});

export const imageRouter = createTRPCRouter({
  /**
   * Upload a product image
   * Note: File upload happens via /api/upload, this creates the database record
   */
  upload: protectedProcedure
    .input(uploadImageSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify project belongs to user
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          userId,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Create ProjectImage record
      const image = await ctx.db.projectImage.create({
        data: {
          projectId: input.projectId,
          url: input.url,
          width: input.width,
          height: input.height,
          size: input.size,
          order: input.order,
        },
      });

      return image;
    }),

  /**
   * Generate listing images using AI
   */
  generate: protectedProcedure
    .input(generateImageSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify project belongs to user
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          userId,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Check user has enough credits
      const creditsRequired = getCreditsRequiredForImage(input.type);
      const creditResult = await ctx.db.creditTransaction.aggregate({
        where: { userId },
        _sum: { amount: true },
      });

      const balance = creditResult._sum.amount || 0;
      if (balance < creditsRequired) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Insufficient credits. You have ${balance} credits but need ${creditsRequired} for ${input.type} generation. Please purchase more credits.`,
        });
      }

      // Deduct credits before generation
      await ctx.db.creditTransaction.create({
        data: {
          userId,
          amount: -creditsRequired,
          type: CreditType.USAGE,
          description: `Generate ${input.type} image for project ${input.projectId}`,
          metadata: {
            projectId: input.projectId,
            imageType: input.type,
            style: input.style,
          },
        },
      });

      // Queue job in Supabase job_queue table
      const job = await ctx.db.$queryRawUnsafe<Array<{ id: string }>>(`
        INSERT INTO job_queue (job_type, payload, user_id)
        VALUES (
          'generate-image',
          $1::jsonb,
          $2::text
        )
        RETURNING id
      `, JSON.stringify({
        projectId: input.projectId,
        imageType: input.type,
        style: input.style,
      }), userId);

      return {
        jobId: job[0]?.id || "unknown",
        status: "queued",
      };
    }),

  /**
   * List product images for a project
   */
  listProductImages: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify project belongs to user
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          userId,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const images = await ctx.db.projectImage.findMany({
        where: { projectId: input.projectId },
        orderBy: { order: "asc" },
      });

      return images;
    }),

  /**
   * List generated images for a project
   */
  list: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify project belongs to user
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          userId,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const images = await ctx.db.generatedImage.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "desc" },
      });

      return images;
    }),

  /**
   * Delete a product image
   */
  deleteProductImage: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify image belongs to user's project
      const image = await ctx.db.projectImage.findFirst({
        where: { id: input.id },
        include: {
          project: true,
        },
      });

      if (!image || image.project.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Image not found",
        });
      }

      // Delete file from Supabase Storage
      try {
        const { extractPathFromUrl } = await import("@/lib/storage");
        const { deleteFile } = await import("@/lib/storage");
        const path = extractPathFromUrl(image.url);
        await deleteFile("product-images", path);
      } catch (error) {
        // Log error but don't fail deletion if storage deletion fails
        console.error("Failed to delete file from storage:", error);
      }

      await ctx.db.projectImage.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Generate complete listing pack (all images + optional A+ content)
   */
  generateCompletePack: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      includeAPlus: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify project belongs to user
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          userId,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Calculate total credits required
      const imageCredits = 43; // 5+10+5+8+10+5 = 43 credits for all 6 image types
      const aPlusCredits = input.includeAPlus ? 20 : 0; // Standard A+ content
      const totalCredits = imageCredits + aPlusCredits;

      // Check user has enough credits
      const creditResult = await ctx.db.creditTransaction.aggregate({
        where: { userId },
        _sum: { amount: true },
      });

      const balance = creditResult._sum.amount || 0;
      if (balance < totalCredits) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Insufficient credits. You have ${balance} credits but need ${totalCredits} for complete pack generation. Please purchase more credits.`,
        });
      }

      // Deduct credits before generation
      await ctx.db.creditTransaction.create({
        data: {
          userId,
          amount: -totalCredits,
          type: CreditType.USAGE,
          description: `Generate complete listing pack for project ${input.projectId}${input.includeAPlus ? " (with A+ content)" : ""}`,
          metadata: {
            projectId: input.projectId,
            packType: "complete",
            includeAPlus: input.includeAPlus,
          },
        },
      });

      // Queue complete pack generation job in Supabase job_queue
      const job = await ctx.db.$queryRawUnsafe<Array<{ id: string }>>(`
        INSERT INTO job_queue (job_type, payload, user_id, max_retries)
        VALUES (
          'generate-complete-pack',
          $1::jsonb,
          $2::text,
          3
        )
        RETURNING id
      `, JSON.stringify({
        projectId: input.projectId,
        includeAPlus: input.includeAPlus,
      }), userId);

      return {
        jobId: job[0]?.id || "unknown",
        status: "queued",
        message: `Complete pack generation started. This will generate all listing images${input.includeAPlus ? " and A+ content" : ""}.`,
      };
    }),

  /**
   * Download image pack as ZIP
   */
  downloadPack: protectedProcedure
    .input(z.object({ projectId: z.string(), format: z.enum(["amazon", "ebay", "etsy", "shopify"]).optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify project belongs to user
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          userId,
        },
        include: {
          generatedImages: true,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (project.generatedImages.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No generated images found for this project",
        });
      }

      // Use export router functionality to generate ZIP
      const { exportForPlatform } = await import("@/lib/api/routers/export.router");

      const platform = (input.format || "amazon") as "amazon" | "ebay" | "etsy" | "shopify";
      const result = await exportForPlatform(
        input.projectId,
        userId,
        platform,
        ctx.db,
      );

      return {
        downloadUrl: result.downloadUrl,
        imageCount: project.generatedImages.length,
        format: platform,
      };
    }),
});

