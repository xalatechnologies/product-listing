/**
 * Inngest function for generating listing images
 */

import { inngest } from "@/../inngest.config";
import { prisma } from "@/lib/db";
import { ProjectStatus, ImageType } from "@prisma/client";

export const generateListingImagesFn = inngest.createFunction(
  { id: "generate-listing-images", name: "Generate Listing Images" },
  { event: "image/generate" },
  async ({ event, step }) => {
    const { projectId, userId, imageType, style } = event.data;

    // Update project status to PROCESSING
    await step.run("Update project status", async () => {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: ProjectStatus.PROCESSING },
      });
    });

    try {
      // Process image generation based on type
      await step.run("Generate image", async () => {
        // Get project with product images
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            productImages: {
              orderBy: { order: "asc" },
              take: 1, // Use first product image
            },
          },
        });

        if (!project) {
          throw new Error("Project not found");
        }

        if (!project.productImages || project.productImages.length === 0) {
          throw new Error("Project has no product images");
        }

        const productImageUrl = project.productImages[0]!.url;

        switch (imageType) {
          case ImageType.MAIN_IMAGE: {
            const { generateMainImage } = await import("@/lib/ai/generators/mainImage");
            await generateMainImage(productImageUrl, projectId, userId);
            break;
          }
          case ImageType.INFOGRAPHIC: {
            const { generateInfographic } = await import("@/lib/ai/generators/infographic");
            // style can be used as templateId if provided, otherwise random template is used
            await generateInfographic(projectId, userId, style, style);
            break;
          }
          case ImageType.FEATURE_HIGHLIGHT: {
            const { generateFeatureHighlight } = await import("@/lib/ai/generators/featureHighlight");
            await generateFeatureHighlight(projectId, userId, undefined, style);
            break;
          }
          case ImageType.LIFESTYLE: {
            const { generateLifestyle } = await import("@/lib/ai/generators/lifestyle");
            await generateLifestyle(projectId, userId, undefined, style);
            break;
          }
          case ImageType.COMPARISON_CHART: {
            const { generateComparisonChart } = await import("@/lib/ai/generators/comparisonChart");
            await generateComparisonChart(projectId, userId, "features", style);
            break;
          }
          case ImageType.DIMENSION_DIAGRAM: {
            const { generateDimensionDiagram } = await import("@/lib/ai/generators/dimensionDiagram");
            await generateDimensionDiagram(projectId, userId, undefined, style);
            break;
          }
          default:
            throw new Error(`Unknown image type: ${imageType}`);
        }
      });

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

