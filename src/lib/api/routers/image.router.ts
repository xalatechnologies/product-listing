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
import { ImageType } from "@prisma/client";

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

      // TODO: Implement image generation after Prisma client is generated
      // Verify project belongs to user
      // Queue Inngest job for image generation
      // Return job ID for status tracking
      throw new Error("Not implemented: Prisma client needs to be generated");
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

      // TODO: Delete file from Supabase Storage
      // const path = extractPathFromUrl(image.url);
      // await deleteFile("product-images", path);

      await ctx.db.projectImage.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * Download image pack as ZIP
   */
  downloadPack: protectedProcedure
    .input(z.object({ projectId: z.string(), format: z.enum(["amazon", "ebay", "etsy", "shopify"]).optional() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // TODO: Implement image pack download after Prisma client is generated
      // Generate ZIP file with all images
      // Return signed URL for download
      throw new Error("Not implemented: Prisma client needs to be generated");
    }),
});

