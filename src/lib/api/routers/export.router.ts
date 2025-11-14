/**
 * Export Router
 * 
 * Handles marketplace exports for different platforms (Amazon, eBay, Etsy, Shopify)
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getMarketplaceSpec } from "@/lib/export/specs";
import { resizeForMarketplace, downloadImage } from "@/lib/export/imageResize";
import { createZipFromBuffers, formatFilename } from "@/lib/export/zipGenerator";
import { uploadFile, getSignedUrl } from "@/lib/storage";
import { ImageType, ExportPlatform } from "@prisma/client";

const exportSchema = z.object({
  projectId: z.string(),
  platform: z.enum(["amazon", "ebay", "etsy", "shopify"]),
});

/**
 * Export images for a specific marketplace platform
 */
export async function exportForPlatform(
  projectId: string,
  userId: string,
  platform: "amazon" | "ebay" | "etsy" | "shopify",
  db: any,
) {
  // Verify project belongs to user
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    include: {
      generatedImages: {
        orderBy: [
          { type: "asc" }, // Main image first
          { createdAt: "asc" },
        ],
      },
    },
  });

  if (!project) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Project not found",
    });
  }

  if (!project.generatedImages || project.generatedImages.length === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No generated images found for this project",
    });
  }

  const spec = getMarketplaceSpec(platform);
  const imageFiles: Array<{ filename: string; buffer: Buffer }> = [];

  // Separate main image from additional images
  const mainImage = project.generatedImages.find((img: { type: ImageType }) => img.type === ImageType.MAIN_IMAGE);
  const additionalImages = project.generatedImages.filter((img: { type: ImageType }) => img.type !== ImageType.MAIN_IMAGE);

  // Process main image first
  if (mainImage) {
    const originalBuffer = await downloadImage(mainImage.url);
    const resizedBuffer = await resizeForMarketplace(originalBuffer, spec, true);
    const filename = formatFilename(spec.mainImage.naming, 0, project.productName);

    imageFiles.push({
      filename,
      buffer: resizedBuffer,
    });
  }

  // Process additional images
  for (let i = 0; i < additionalImages.length; i++) {
    const image = additionalImages[i]!;
    const originalBuffer = await downloadImage(image.url);
    const resizedBuffer = await resizeForMarketplace(originalBuffer, spec, false);
    const filename = formatFilename(spec.additionalImages.naming, i + 1, project.productName);

    imageFiles.push({
      filename,
      buffer: resizedBuffer,
    });
  }

  // Create ZIP file
  const zipBuffer = await createZipFromBuffers(
    imageFiles,
    `${platform}-export-${projectId}.zip`,
  );

  // Upload ZIP to Supabase Storage (exports bucket)
  const zipPath = `${userId}/${projectId}/${platform}-${Date.now()}.zip`;
  await uploadFile("exports", zipPath, zipBuffer, {
    contentType: "application/zip",
    upsert: false,
  });

  // Get signed download URL (exports bucket is private)
  const downloadUrl = await getSignedUrl("exports", zipPath, 3600); // 1 hour expiry

  // Map platform string to ExportPlatform enum
  const platformEnum: ExportPlatform = platform.toUpperCase() as ExportPlatform;

  // Save export record to database
  const exportRecord = await db.export.create({
    data: {
      userId,
      projectId,
      platform: platformEnum,
      downloadUrl,
      filePath: zipPath,
      fileSize: zipBuffer.length,
      imageCount: imageFiles.length,
    },
  });

  return {
    downloadUrl,
    fileSize: zipBuffer.length,
    imageCount: imageFiles.length,
    platform,
    exportId: exportRecord.id,
  };
}

export const exportRouter = createTRPCRouter({
  /**
   * Export images for Amazon
   */
  exportAmazon: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await exportForPlatform(input.projectId, ctx.session.user.id, "amazon", ctx.db);
    }),

  /**
   * Export images for eBay
   */
  exportEbay: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await exportForPlatform(input.projectId, ctx.session.user.id, "ebay", ctx.db);
    }),

  /**
   * Export images for Etsy
   */
  exportEtsy: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await exportForPlatform(input.projectId, ctx.session.user.id, "etsy", ctx.db);
    }),

  /**
   * Export images for Shopify
   */
  exportShopify: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await exportForPlatform(input.projectId, ctx.session.user.id, "shopify", ctx.db);
    }),

  /**
   * Generic export procedure that routes to platform-specific export
   */
  export: protectedProcedure
    .input(exportSchema)
    .mutation(async ({ ctx, input }) => {
      return await exportForPlatform(
        input.projectId,
        ctx.session.user.id,
        input.platform,
        ctx.db,
      );
    }),

  /**
   * Get export history for a project
   */
  getHistory: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify project belongs to user
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          userId: ctx.session.user.id,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // Get exports for this project, ordered by most recent first
      const exports = await ctx.db.export.findMany({
        where: {
          projectId: input.projectId,
          userId: ctx.session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          platform: true,
          filePath: true,
          fileSize: true,
          imageCount: true,
          createdAt: true,
        },
      });

      // Generate fresh signed URLs for each export (since they expire)
      const exportsWithUrls = await Promise.all(
        exports.map(async (exp) => {
          // Regenerate signed URL from stored filePath
          const downloadUrl = await getSignedUrl("exports", exp.filePath, 3600); // 1 hour expiry
          
          return {
            id: exp.id,
            platform: exp.platform,
            downloadUrl,
            fileSize: exp.fileSize,
            imageCount: exp.imageCount,
            createdAt: exp.createdAt,
          };
        }),
      );

      return exportsWithUrls;
    }),
});

