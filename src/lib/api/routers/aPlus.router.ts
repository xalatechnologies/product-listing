/**
 * A+ Content router for managing Amazon A+ content generation.
 *
 * Handles:
 * - Generating A+ content
 * - Updating A+ modules
 * - Exporting A+ content
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { analyzeProductForAPlus } from "@/lib/aplus/contentAnalysis";
import { getRandomTemplateForModule, applyBrandKitToTemplate } from "@/lib/aplus/templates";
import { getStandardModules } from "@/lib/aplus/moduleSpecs";

const aPlusModuleSchema = z.object({
  type: z.string(),
  content: z.any(), // Flexible JSON structure
});

const generateAPlusSchema = z.object({
  projectId: z.string(),
  isPremium: z.boolean().default(false),
});

const updateAPlusSchema = z.object({
  projectId: z.string(),
  modules: z.array(aPlusModuleSchema),
  isPremium: z.boolean().optional(),
});

export const aPlusRouter = createTRPCRouter({
  /**
   * Generate A+ content for a project
   */
  generate: protectedProcedure
    .input(generateAPlusSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify project belongs to user
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          userId,
        },
        include: {
          brandKit: true,
          productImages: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      // TODO: Check user has enough credits (A+ costs more)
      // const user = await ctx.db.user.findUnique({ where: { id: userId } });
      // const creditsRequired = input.isPremium ? 50 : 20;
      // if (!user || user.credits < creditsRequired) {
      //   throw new TRPCError({
      //     code: "PAYMENT_REQUIRED",
      //     message: "Insufficient credits for A+ content generation",
      //   });
      // }

      // Step 1: Analyze product data using GPT-5
      const analysis = await analyzeProductForAPlus({
        productName: project.productName,
        description: project.description || undefined,
        category: project.productCategory || undefined,
        productImages: project.productImages,
      });

      // Step 2: Generate module layouts
      const availableModules = input.isPremium
        ? getStandardModules() // For now, use standard modules (premium modules can be added later)
        : getStandardModules();

      // Select modules (4-6 modules)
      const selectedModules = availableModules.slice(0, Math.min(6, Math.max(4, analysis.modules.length)));

      const generatedModules = selectedModules.map((moduleSpec, index) => {
        const moduleContent = analysis.modules[index] || analysis.modules[0]!;
        const template = getRandomTemplateForModule(moduleSpec.id);

        // Apply brand kit if available
        const finalTemplate = project.brandKit && template
          ? applyBrandKitToTemplate(template, {
              primaryColor: project.brandKit.primaryColor || undefined,
              secondaryColor: project.brandKit.secondaryColor || undefined,
              accentColor: project.brandKit.accentColor || undefined,
            })
          : template;

        return {
          type: moduleSpec.id,
          templateId: finalTemplate?.id || `default-${moduleSpec.id}`,
          content: {
            headline: moduleContent.headline,
            bodyText: moduleContent.bodyText,
            imageDescriptions: moduleContent.imageDescriptions,
            ...moduleContent.additionalContent,
          },
          template: finalTemplate ? JSON.parse(JSON.stringify(finalTemplate)) : null,
        };
      });

      // Step 3: Create or update APlusContent record
      const aPlusContent = await ctx.db.aPlusContent.upsert({
        where: { projectId: input.projectId },
        create: {
          projectId: input.projectId,
          modules: generatedModules,
          isPremium: input.isPremium,
        },
        update: {
          modules: generatedModules,
          isPremium: input.isPremium,
        },
      });

      return {
        id: aPlusContent.id,
        projectId: aPlusContent.projectId,
        modules: generatedModules,
        isPremium: aPlusContent.isPremium,
        analysis,
      };
    }),

  /**
   * Update A+ content modules
   */
  update: protectedProcedure
    .input(updateAPlusSchema)
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

      // Update APlusContent record
      const aPlusContent = await ctx.db.aPlusContent.upsert({
        where: { projectId: input.projectId },
        create: {
          projectId: input.projectId,
          modules: input.modules,
          isPremium: input.isPremium || false,
        },
        update: {
          modules: input.modules,
          ...(input.isPremium !== undefined ? { isPremium: input.isPremium } : {}),
        },
      });

      return {
        id: aPlusContent.id,
        projectId: aPlusContent.projectId,
        modules: aPlusContent.modules,
        isPremium: aPlusContent.isPremium,
      };
    }),

  /**
   * Get A+ content for a project
   */
  get: protectedProcedure
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

      // Get APlusContent
      const aPlusContent = await ctx.db.aPlusContent.findUnique({
        where: { projectId: input.projectId },
      });

      if (!aPlusContent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "A+ content not found for this project",
        });
      }

      return {
        id: aPlusContent.id,
        projectId: aPlusContent.projectId,
        modules: aPlusContent.modules as any,
        isPremium: aPlusContent.isPremium,
        createdAt: aPlusContent.createdAt,
        updatedAt: aPlusContent.updatedAt,
      };
    }),

  /**
   * Export A+ content as images
   */
  export: protectedProcedure
    .input(z.object({ projectId: z.string(), format: z.enum(["png", "jpg"]).default("png") }))
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

      // Get APlusContent
      const aPlusContent = await ctx.db.aPlusContent.findUnique({
        where: { projectId: input.projectId },
      });

      if (!aPlusContent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "A+ content not found for this project",
        });
      }

      // TODO: Implement actual image rendering and ZIP generation
      // For now, return a placeholder response
      // This will be implemented in Story 15 (A+ Content Generator - Rendering)
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "A+ content export (image rendering) will be implemented in Story 15",
      });

      // Future implementation:
      // 1. Render each module as image using renderer
      // 2. Generate images at Amazon-required sizes (970px width)
      // 3. Create ZIP file with all module images
      // 4. Upload ZIP to Supabase Storage (exports bucket)
      // 5. Return signed download URL
    }),
});

