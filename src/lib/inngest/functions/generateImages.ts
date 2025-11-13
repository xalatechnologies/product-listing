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
        // TODO: Implement actual image generation logic
        // This will call the appropriate generator based on imageType
        // For now, we'll just simulate the process
        
        switch (imageType) {
          case ImageType.MAIN_IMAGE:
            // await generateMainImage(projectId, userId);
            console.log(`Generating main image for project ${projectId}`);
            break;
          case ImageType.INFOGRAPHIC:
            // await generateInfographic(projectId, userId, style);
            console.log(`Generating infographic for project ${projectId} with style ${style}`);
            break;
          case ImageType.LIFESTYLE:
            // await generateLifestyleImage(projectId, userId, style);
            console.log(`Generating lifestyle image for project ${projectId} with style ${style}`);
            break;
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

