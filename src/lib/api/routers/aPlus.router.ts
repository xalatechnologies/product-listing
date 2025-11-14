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
import { exportAPlusContent } from "@/lib/aplus/export";
import { getCreditsRequiredForAPlus } from "@/lib/utils/credits";
import { CreditType } from "@prisma/client";

const aPlusModuleSchema = z.object({
  type: z.string(),
  content: z.any(), // Flexible JSON structure
});

const generateAPlusSchema = z.object({
  projectId: z.string(),
  isPremium: z.boolean().default(false),
  generateImages: z.boolean().default(false), // Whether to automatically generate images for modules
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

      // Check user has enough credits (A+ costs more)
      const creditsRequired = getCreditsRequiredForAPlus(input.isPremium);
      const creditResult = await ctx.db.creditTransaction.aggregate({
        where: { userId },
        _sum: { amount: true },
      });

      const balance = creditResult._sum.amount || 0;
      if (balance < creditsRequired) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Insufficient credits. You have ${balance} credits but need ${creditsRequired} for ${input.isPremium ? "Premium" : "Standard"} A+ content generation. Please purchase more credits.`,
        });
      }

      // Deduct credits before generation
      await ctx.db.creditTransaction.create({
        data: {
          userId,
          amount: -creditsRequired,
          type: CreditType.USAGE,
          description: `Generate ${input.isPremium ? "Premium" : "Standard"} A+ content for project ${input.projectId}`,
          metadata: {
            projectId: input.projectId,
            isPremium: input.isPremium,
          },
        },
      });

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

      // Step 4: Optionally generate images for modules
      let generatedImageCount = 0;
      if (input.generateImages) {
        try {
          const { generateAPlusModuleImages } = await import("@/lib/aplus/imageGeneration");
          const productImageUrl = project.productImages?.[0]?.url;
          
          const imageResults = await generateAPlusModuleImages(
            input.projectId,
            userId,
            generatedModules,
            project.productName,
            productImageUrl,
          );
          
          generatedImageCount = imageResults.length;
        } catch (error) {
          console.error("Failed to generate A+ images:", error);
          // Don't fail the entire request if image generation fails
        }
      }

      return {
        id: aPlusContent.id,
        projectId: aPlusContent.projectId,
        modules: generatedModules,
        isPremium: aPlusContent.isPremium,
        analysis,
        generatedImageCount,
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
        // Return null instead of throwing error - allows UI to show "generate" button
        return null;
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

      // Export A+ content as images
      const exportResult = await exportAPlusContent({
        projectId: input.projectId,
        userId,
        format: input.format,
      });

      return {
        downloadUrl: exportResult.downloadUrl,
        fileSize: exportResult.fileSize,
        moduleCount: exportResult.moduleCount,
      };
    }),

  /**
   * Generate images for A+ content modules
   */
  generateImages: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      moduleIndex: z.number().optional(), // If provided, only generate for this module
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify project belongs to user
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          userId,
        },
        include: {
          productImages: {
            orderBy: { order: "asc" },
            take: 1,
          },
          aPlusContent: true,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (!project.aPlusContent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "A+ content not found. Please generate A+ content first.",
        });
      }

      const modules = project.aPlusContent.modules as any[];
      const modulesToProcess = input.moduleIndex !== undefined
        ? [modules[input.moduleIndex]!].filter(Boolean)
        : modules;

      const { generateAPlusModuleImages } = await import("@/lib/aplus/imageGeneration");
      const productImageUrl = project.productImages?.[0]?.url;

      const results = await generateAPlusModuleImages(
        input.projectId,
        userId,
        modulesToProcess,
        project.productName,
        productImageUrl,
      );

      return {
        generatedCount: results.length,
        images: results,
      };
    }),

  /**
   * Generate comparison image for A+ content
   */
  generateComparisonImage: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      moduleIndex: z.number().optional(), // Module with comparison data
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Verify project belongs to user
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.projectId,
          userId,
        },
        include: {
          productImages: {
            orderBy: { order: "asc" },
            take: 1,
          },
          aPlusContent: true,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      if (!project.aPlusContent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "A+ content not found",
        });
      }

      const modules = project.aPlusContent.modules as any[];
      const module = input.moduleIndex !== undefined
        ? modules[input.moduleIndex]
        : modules.find((m: any) => m.content?.additionalContent?.comparisonData);

      if (!module || !module.content?.additionalContent?.comparisonData) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No comparison data found in modules",
        });
      }

      const { generateComparisonImage } = await import("@/lib/aplus/imageGeneration");
      const productImageUrl = project.productImages?.[0]?.url;

      const result = await generateComparisonImage(
        input.projectId,
        userId,
        project.productName,
        module.content.additionalContent.comparisonData,
        productImageUrl,
      );

      return result;
    }),
});

