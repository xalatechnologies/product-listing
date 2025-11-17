/**
 * Lifestyle Image Generation Agent
 * 
 * Generates realistic lifestyle scenes featuring the product in use.
 */

import { BaseAgent, type AgentContext, type AgentResult } from "../base";
import { createAgentError, AgentErrorCodes } from "../base/AgentError";
import { createInvalidResult, createValidationError } from "../base/ValidationResult";
import { prisma } from "@/lib/db";
import { ImageType } from "@prisma/client";
import { generateImageFromPrompt, downloadGeneratedImage } from "@/lib/ai/imageGeneration";
import { uploadGeneratedImage } from "@/lib/storage";

export interface LifestyleInput {
  projectId: string;
  userId: string;
  sceneDescription?: string;
  style?: string;
}

export interface LifestyleOutput {
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}

export class LifestyleAgent extends BaseAgent<LifestyleInput, LifestyleOutput> {
  readonly name = "lifestyle-generator";
  readonly version = "1.0.0";
  readonly description = "Generates lifestyle images showing products in realistic use scenarios";

  async validate(input: LifestyleInput) {
    const errors = [];

    if (!input.projectId) {
      errors.push(createValidationError("Project ID is required", "projectId", "REQUIRED"));
    }

    if (!input.userId) {
      errors.push(createValidationError("User ID is required", "userId", "REQUIRED"));
    }

    if (errors.length > 0) {
      return createInvalidResult(errors);
    }

    return { valid: true, errors: [] };
  }

  async process(input: LifestyleInput, context: AgentContext): Promise<AgentResult<LifestyleOutput>> {
    const startTime = Date.now();

    try {
      // Validate input
      const validation = await this.validate(input);
      if (!validation.valid) {
        return this.createErrorResult(
          new Error(validation.errors.map((e) => e.message).join(", ")),
          { validationErrors: validation.errors },
        );
      }

      // Step 1: Get project data
      const project = await prisma.project.findUnique({
        where: { id: input.projectId },
        include: {
          brandKit: true,
          productImages: {
            orderBy: { order: "asc" },
            take: 1,
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

      // Step 2: Build prompt for lifestyle scene
      const prompt = this.createLifestylePrompt(
        project,
        productImageUrl,
        project.brandKit,
        input.sceneDescription,
        input.style,
      );

      // Step 3: Generate image using DALL-E 3
      const generatedImages = await generateImageFromPrompt({
        prompt,
        size: "1792x1024",
        quality: "hd",
        style: "natural",
        n: 1,
      });

      if (!generatedImages || generatedImages.length === 0) {
        throw new Error("Failed to generate lifestyle image");
      }

      // Step 4: Download and process image
      const imageBuffer = await downloadGeneratedImage(generatedImages[0]!.url);

      // Step 5: Upload to Supabase Storage
      const imageUrl = await uploadGeneratedImage(
        input.userId,
        input.projectId,
        ImageType.LIFESTYLE,
        imageBuffer,
        input.style,
      );

      // Step 6: Create GeneratedImage record
      const generatedImage = await prisma.generatedImage.create({
        data: {
          projectId: input.projectId,
          type: ImageType.LIFESTYLE,
          style: input.style || "default",
          url: imageUrl,
          width: 1792,
          height: 1024,
          size: imageBuffer.length,
          metadata: {
            sceneDescription: input.sceneDescription || "default",
            productName: project.productName,
            productImageUrl,
            revisedPrompt: generatedImages[0]!.revisedPrompt,
          },
        },
      });

      const processingTime = Date.now() - startTime;

      return this.createSuccessResult(
        {
          url: imageUrl,
          width: 1792,
          height: 1024,
          size: imageBuffer.length,
          imageId: generatedImage.id,
        },
        {
          processingTime,
          sceneDescription: input.sceneDescription,
        },
      );
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const agentError = createAgentError(
        error instanceof Error ? error : new Error(String(error)),
        {
          code: AgentErrorCodes.PROCESSING_ERROR,
          agentName: this.name,
          retryable: await this.shouldRetry(
            input,
            error instanceof Error ? error : new Error(String(error)),
            0,
          ),
        },
      );

      return this.createErrorResult(
        error instanceof Error ? error : new Error(String(error)),
        {
          processingTime,
          error: agentError,
        },
      );
    }
  }

  private createLifestylePrompt(
    project: { productName: string; description?: string | null },
    productImageUrl: string,
    brandKit: { primaryColor?: string | null; secondaryColor?: string | null; accentColor?: string | null } | null,
    sceneDescription?: string,
    style?: string,
  ): string {
    const scene = sceneDescription || "realistic everyday use scenario";
    const brandColors = brandKit
      ? `Incorporate brand colors: Primary ${brandKit.primaryColor || "default"}, Secondary ${brandKit.secondaryColor || "default"}`
      : "";

    return `Create a realistic lifestyle image showing "${project.productName}" being used in ${scene}.

Product: ${project.productName}
${project.description ? `Description: ${project.description}` : ""}
Product Image Reference: ${productImageUrl}

Scene Requirements:
- Natural, realistic setting
- Product shown in actual use
- Professional photography style
- Well-lit, high quality
- Amazon listing style
${brandColors}
${style ? `Style: ${style}` : ""}

Make it feel authentic and relatable to potential customers.`;
  }

  async shouldRetry(input: LifestyleInput, error: Error, attempt: number): Promise<boolean> {
    if (attempt >= 2) return false;

    const retryablePatterns = ["network", "timeout", "rate limit", "503", "429"];
    const errorMessage = error.message.toLowerCase();
    return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
  }

  async getCreditsRequired(input: LifestyleInput): Promise<number> {
    return 7; // Lifestyle generation costs 7 credits
  }
}

