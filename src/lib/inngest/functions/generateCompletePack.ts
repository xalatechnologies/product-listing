/**
 * Inngest function for generating complete listing pack
 * Generates all listing images (7-9 images) in one workflow
 */

import { inngest } from "@/../inngest.config";
import { prisma } from "@/lib/db";
import { ProjectStatus, ImageType } from "@prisma/client";

export const generateCompletePackFn = inngest.createFunction(
  { id: "generate-complete-pack", name: "Generate Complete Listing Pack" },
  { event: "pack/generate-complete" },
  async ({ event, step }) => {
    const { projectId, userId, includeAPlus } = event.data;

    // Update project status to PROCESSING
    await step.run("Update project status", async () => {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.PROCESSING },
      });
    });

    try {
      // Get project with product images
      const project = await step.run("Get project data", async () => {
        const proj = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            productImages: {
              orderBy: { order: "asc" },
              take: 1,
            },
          },
        });

        if (!proj) {
          throw new Error("Project not found");
        }

        if (!proj.productImages || proj.productImages.length === 0) {
          throw new Error("Project has no product images");
        }

        return proj;
      });

      const productImageUrl = project.productImages[0]!.url;

      // Generate all listing images in parallel steps
      const imageTypes = [
        ImageType.MAIN_IMAGE,
        ImageType.INFOGRAPHIC,
        ImageType.FEATURE_HIGHLIGHT,
        ImageType.LIFESTYLE,
        ImageType.COMPARISON_CHART,
        ImageType.DIMENSION_DIAGRAM,
      ];

      // Generate each image type
      await step.run("Generate listing images", async () => {
        const generationPromises = imageTypes.map(async (imageType) => {
          try {
            switch (imageType) {
              case ImageType.MAIN_IMAGE: {
                const { generateMainImage } = await import("@/lib/ai/generators/mainImage");
                await generateMainImage(productImageUrl, projectId, userId);
                break;
              }
              case ImageType.INFOGRAPHIC: {
                const { generateInfographic } = await import("@/lib/ai/generators/infographic");
                await generateInfographic(projectId, userId);
                break;
              }
              case ImageType.FEATURE_HIGHLIGHT: {
                const { generateFeatureHighlight } = await import("@/lib/ai/generators/featureHighlight");
                await generateFeatureHighlight(projectId, userId);
                break;
              }
              case ImageType.LIFESTYLE: {
                const { generateLifestyle } = await import("@/lib/ai/generators/lifestyle");
                await generateLifestyle(projectId, userId);
                break;
              }
              case ImageType.COMPARISON_CHART: {
                const { generateComparisonChart } = await import("@/lib/ai/generators/comparisonChart");
                await generateComparisonChart(projectId, userId, "features");
                break;
              }
              case ImageType.DIMENSION_DIAGRAM: {
                const { generateDimensionDiagram } = await import("@/lib/ai/generators/dimensionDiagram");
                await generateDimensionDiagram(projectId, userId);
                break;
              }
              default:
                console.warn(`Unknown image type: ${imageType}`);
            }
          } catch (error) {
            console.error(`Failed to generate ${imageType}:`, error);
            // Continue with other images even if one fails
          }
        });

        await Promise.allSettled(generationPromises);
      });

      // Generate A+ content if requested
      if (includeAPlus) {
        await step.run("Generate A+ content", async () => {
          try {
            const { analyzeProductForAPlus } = await import("@/lib/aplus/contentAnalysis");
            const { getRandomTemplateForModule, applyBrandKitToTemplate } = await import("@/lib/aplus/templates");
            const { getStandardModules } = await import("@/lib/aplus/moduleSpecs");

            const projectWithBrandKit = await prisma.project.findUnique({
              where: { id: projectId },
              include: {
                brandKit: true,
                productImages: true,
              },
            });

            if (!projectWithBrandKit) {
              throw new Error("Project not found");
            }

            // Analyze product data
            const analysis = await analyzeProductForAPlus({
              productName: projectWithBrandKit.productName,
              description: projectWithBrandKit.description || undefined,
              category: projectWithBrandKit.productCategory || undefined,
              productImages: projectWithBrandKit.productImages,
            });

            // Generate modules
            const availableModules = getStandardModules();
            const selectedModules = availableModules.slice(0, Math.min(6, Math.max(4, analysis.modules.length)));

            const generatedModules = selectedModules.map((moduleSpec, index) => {
              const moduleContent = analysis.modules[index] || analysis.modules[0]!;
              const template = getRandomTemplateForModule(moduleSpec.id);

              const finalTemplate = projectWithBrandKit.brandKit && template
                ? applyBrandKitToTemplate(template, {
                    primaryColor: projectWithBrandKit.brandKit.primaryColor || undefined,
                    secondaryColor: projectWithBrandKit.brandKit.secondaryColor || undefined,
                    accentColor: projectWithBrandKit.brandKit.accentColor || undefined,
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

            // Create or update APlusContent record
            await prisma.aPlusContent.upsert({
              where: { projectId },
              update: {
                modules: generatedModules as any,
                isPremium: false,
                updatedAt: new Date(),
              },
              create: {
                projectId,
                modules: generatedModules as any,
                isPremium: false,
              },
            });
          } catch (error) {
            console.error("Failed to generate A+ content:", error);
            // Don't fail the entire pack if A+ generation fails
          }
        });
      }

      // Update project status to COMPLETED
      await step.run("Update project status to completed", async () => {
        await prisma.project.update({
          where: { id: projectId },
          data: { status: ProjectStatus.COMPLETED },
        });
      });
    } catch (error) {
      // Update project status to FAILED
      await step.run("Update project status to failed", async () => {
        await prisma.project.update({
          where: { id: projectId },
          data: { status: ProjectStatus.FAILED },
        });
      });

      throw error;
    }
  },
);

