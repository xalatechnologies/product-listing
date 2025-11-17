/**
 * Feature Highlight Generation Agent
 * 
 * Generates images that highlight a single product feature with visual emphasis.
 */

import { BaseAgent, type AgentContext, type AgentResult } from "../base";
import { createAgentError, AgentErrorCodes } from "../base/AgentError";
import { createInvalidResult, createValidationError } from "../base/ValidationResult";
import { prisma } from "@/lib/db";
import { ImageType } from "@prisma/client";
import { generateImageFromPrompt, downloadGeneratedImage } from "@/lib/ai/imageGeneration";
import { uploadGeneratedImage } from "@/lib/storage";
import { extractFeaturesFromProduct } from "@/lib/ai/featureExtraction";

export interface FeatureHighlightInput {
  projectId: string;
  userId: string;
  featureTitle?: string;
  style?: string;
}

export interface FeatureHighlightOutput {
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}

export class FeatureHighlightAgent extends BaseAgent<FeatureHighlightInput, FeatureHighlightOutput> {
  readonly name = "feature-highlight-generator";
  readonly version = "1.0.0";
  readonly description = "Generates feature highlight images for Amazon product listings";

  async validate(input: FeatureHighlightInput) {
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

  async process(
    input: FeatureHighlightInput,
    context: AgentContext,
  ): Promise<AgentResult<FeatureHighlightOutput>> {
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

      // Step 2: Extract or use provided feature
      let featureToHighlight: string;
      if (input.featureTitle) {
        featureToHighlight = input.featureTitle;
      } else {
        const featureResult = await extractFeaturesFromProduct({
          productName: project.productName,
          description: project.description || undefined,
          category: project.productCategory || undefined,
        });
        featureToHighlight = featureResult.features[0]?.title || "Premium Quality";
      }

      // Step 3: Build prompt for feature highlight
      const prompt = this.createFeatureHighlightPrompt(project, featureToHighlight, project.brandKit, input.style);

      // Step 4: Generate image using DALL-E 3
      const generatedImages = await generateImageFromPrompt({
        prompt,
        size: "1024x1024",
        quality: "hd",
        style: "vivid",
        n: 1,
      });

      if (!generatedImages || generatedImages.length === 0) {
        throw new Error("Failed to generate feature highlight image");
      }

      // Step 5: Download and process image
      const imageBuffer = await downloadGeneratedImage(generatedImages[0]!.url);

      // Step 6: Upload to Supabase Storage
      const imageUrl = await uploadGeneratedImage(
        input.userId,
        input.projectId,
        ImageType.FEATURE_HIGHLIGHT,
        imageBuffer,
        input.style,
      );

      // Step 7: Create GeneratedImage record
      const generatedImage = await prisma.generatedImage.create({
        data: {
          projectId: input.projectId,
          type: ImageType.FEATURE_HIGHLIGHT,
          style: input.style || "default",
          url: imageUrl,
          width: 1024,
          height: 1024,
          size: imageBuffer.length,
          metadata: {
            featureTitle: featureToHighlight,
            productName: project.productName,
            revisedPrompt: generatedImages[0]!.revisedPrompt,
          },
        },
      });

      const processingTime = Date.now() - startTime;

      return this.createSuccessResult(
        {
          url: imageUrl,
          width: 1024,
          height: 1024,
          size: imageBuffer.length,
          imageId: generatedImage.id,
        },
        {
          processingTime,
          featureTitle: featureToHighlight,
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

  private createFeatureHighlightPrompt(
    project: { productName: string; description?: string | null },
    featureTitle: string,
    brandKit: { primaryColor?: string | null; secondaryColor?: string | null; accentColor?: string | null } | null,
    style?: string,
  ): string {
    const brandColors = brandKit
      ? `Use brand colors: Primary ${brandKit.primaryColor || "default"}, Secondary ${brandKit.secondaryColor || "default"}`
      : "";

    return `Create a professional feature highlight image for "${project.productName}".

Feature to Highlight: ${featureTitle}

Product: ${project.productName}
${project.description ? `Description: ${project.description}` : ""}

Design Requirements:
- Focus on the feature: ${featureTitle}
- Professional, eye-catching design
- Clear visual emphasis on the highlighted feature
- Amazon listing style
${brandColors}
${style ? `Style: ${style}` : ""}

Make it visually compelling and clearly communicate the feature benefit.`;
  }

  async shouldRetry(input: FeatureHighlightInput, error: Error, attempt: number): Promise<boolean> {
    if (attempt >= 2) return false;

    const retryablePatterns = ["network", "timeout", "rate limit", "503", "429"];
    const errorMessage = error.message.toLowerCase();
    return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
  }

  async getCreditsRequired(input: FeatureHighlightInput): Promise<number> {
    return 6; // Feature highlight generation costs 6 credits
  }
}

