/**
 * Dimension Diagram Generation Agent
 * 
 * Generates technical dimension diagrams showing product measurements.
 */

import { BaseAgent, type AgentContext, type AgentResult } from "../base";
import { createAgentError, AgentErrorCodes } from "../base/AgentError";
import { createInvalidResult, createValidationError } from "../base/ValidationResult";
import { prisma } from "@/lib/db";
import { ImageType } from "@prisma/client";
import { generateImageFromPrompt, downloadGeneratedImage } from "@/lib/ai/imageGeneration";
import { uploadGeneratedImage } from "@/lib/storage";

export interface DimensionDiagramInput {
  projectId: string;
  userId: string;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    unit?: string;
  };
  style?: string;
}

export interface DimensionDiagramOutput {
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}

export class DimensionDiagramAgent extends BaseAgent<DimensionDiagramInput, DimensionDiagramOutput> {
  readonly name = "dimension-diagram-generator";
  readonly version = "1.0.0";
  readonly description = "Generates technical dimension diagrams for Amazon product listings";

  async validate(input: DimensionDiagramInput) {
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
    input: DimensionDiagramInput,
    context: AgentContext,
  ): Promise<AgentResult<DimensionDiagramOutput>> {
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

      // Step 2: Use provided dimensions or generate generic diagram
      const productDimensions = input.dimensions || {
        length: undefined,
        width: undefined,
        height: undefined,
        weight: undefined,
        unit: "inches",
      };

      // Step 3: Build prompt for dimension diagram
      const prompt = this.createDimensionDiagramPrompt(
        project,
        productImageUrl,
        productDimensions,
        project.brandKit,
        input.style,
      );

      // Step 4: Generate image using DALL-E 3
      const generatedImages = await generateImageFromPrompt({
        prompt,
        size: "1024x1792",
        quality: "hd",
        style: "natural",
        n: 1,
      });

      if (!generatedImages || generatedImages.length === 0) {
        throw new Error("Failed to generate dimension diagram");
      }

      // Step 5: Download and process image
      const imageBuffer = await downloadGeneratedImage(generatedImages[0]!.url);

      // Step 6: Upload to Supabase Storage
      const imageUrl = await uploadGeneratedImage(
        input.userId,
        input.projectId,
        ImageType.DIMENSION_DIAGRAM,
        imageBuffer,
        input.style,
      );

      // Step 7: Create GeneratedImage record
      const generatedImage = await prisma.generatedImage.create({
        data: {
          projectId: input.projectId,
          type: ImageType.DIMENSION_DIAGRAM,
          style: input.style || "default",
          url: imageUrl,
          width: 1024,
          height: 1792,
          size: imageBuffer.length,
          metadata: {
            dimensions: productDimensions,
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
          width: 1024,
          height: 1792,
          size: imageBuffer.length,
          imageId: generatedImage.id,
        },
        {
          processingTime,
          dimensions: productDimensions,
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

  private createDimensionDiagramPrompt(
    project: { productName: string; description?: string | null },
    productImageUrl: string,
    dimensions: {
      length?: number;
      width?: number;
      height?: number;
      weight?: number;
      unit?: string;
    },
    brandKit: { primaryColor?: string | null; secondaryColor?: string | null; accentColor?: string | null } | null,
    style?: string,
  ): string {
    const dimensionText = [
      dimensions.length && `Length: ${dimensions.length} ${dimensions.unit || "inches"}`,
      dimensions.width && `Width: ${dimensions.width} ${dimensions.unit || "inches"}`,
      dimensions.height && `Height: ${dimensions.height} ${dimensions.unit || "inches"}`,
      dimensions.weight && `Weight: ${dimensions.weight} ${dimensions.unit === "cm" ? "kg" : "lbs"}`,
    ]
      .filter(Boolean)
      .join(", ");

    const brandColors = brandKit
      ? `Use brand colors: Primary ${brandKit.primaryColor || "default"}, Secondary ${brandKit.secondaryColor || "default"}`
      : "";

    return `Create a professional technical dimension diagram for "${project.productName}".

Product: ${project.productName}
${project.description ? `Description: ${project.description}` : ""}
Product Image Reference: ${productImageUrl}

Dimensions:
${dimensionText || "Standard dimensions (show generic measurement diagram)"}

Design Requirements:
- Technical, precise diagram style
- Clear measurement labels and arrows
- Professional technical drawing style
- Easy to read dimensions
- Amazon listing style
${brandColors}
${style ? `Style: ${style}` : ""}

Make it clear and professional, showing all key measurements.`;
  }

  async shouldRetry(input: DimensionDiagramInput, error: Error, attempt: number): Promise<boolean> {
    if (attempt >= 2) return false;

    const retryablePatterns = ["network", "timeout", "rate limit", "503", "429"];
    const errorMessage = error.message.toLowerCase();
    return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
  }

  async getCreditsRequired(input: DimensionDiagramInput): Promise<number> {
    return 6; // Dimension diagram generation costs 6 credits
  }
}

