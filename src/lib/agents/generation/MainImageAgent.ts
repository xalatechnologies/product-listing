/**
 * Main Image Generation Agent
 * 
 * Generates Amazon-compliant main product images (1000x1000px, white background).
 * Orchestrates background removal, resizing, and composition.
 */

import { BaseAgent, type AgentContext, type AgentResult } from "../base";
import { createAgentError, AgentErrorCodes } from "../base/AgentError";
import { createInvalidResult, createValidationError } from "../base/ValidationResult";
import { BackgroundRemovalAgent } from "../image/BackgroundRemovalAgent";
import { ImageProcessorAgent } from "../image/ImageProcessorAgent";
import sharp from "sharp";
import { uploadGeneratedImage } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { ImageType } from "@prisma/client";

export interface MainImageInput {
  /** URL of the product image */
  productImageUrl: string;
  
  /** Project ID */
  projectId: string;
  
  /** User ID */
  userId: string;
  
  /** Optional: custom background color (default: white) */
  backgroundColor?: { r: number; g: number; b: number };
  
  /** Optional: padding from edges (default: 50px) */
  padding?: number;
}

export interface MainImageOutput {
  /** Generated image URL */
  url: string;
  
  /** Image width */
  width: number;
  
  /** Image height */
  height: number;
  
  /** File size in bytes */
  size: number;
  
  /** Database image ID */
  imageId: string;
}

export class MainImageAgent extends BaseAgent<MainImageInput, MainImageOutput> {
  readonly name = "main-image-generator";
  readonly version = "1.0.0";
  readonly description = "Generates Amazon-compliant main product images (1000x1000px, white background)";

  private backgroundRemovalAgent: BackgroundRemovalAgent;
  private imageProcessorAgent: ImageProcessorAgent;

  constructor() {
    super();
    this.backgroundRemovalAgent = new BackgroundRemovalAgent();
    this.imageProcessorAgent = new ImageProcessorAgent();
  }

  async validate(input: MainImageInput) {
    const errors = [];

    if (!input.productImageUrl) {
      errors.push(createValidationError("Product image URL is required", "productImageUrl", "REQUIRED"));
    } else if (!input.productImageUrl.startsWith("http://") && !input.productImageUrl.startsWith("https://")) {
      errors.push(createValidationError("Product image URL must be a valid HTTP/HTTPS URL", "productImageUrl", "INVALID_URL"));
    }

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

  async process(input: MainImageInput, context: AgentContext): Promise<AgentResult<MainImageOutput>> {
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

      // Step 1: Remove background
      const bgRemovalContext = {
        userId: input.userId,
        projectId: input.projectId,
        metadata: { ...context.metadata, step: "background-removal" },
      };

      const bgRemovalResult = await this.backgroundRemovalAgent.process(
        { imageUrl: input.productImageUrl, provider: "auto" },
        bgRemovalContext,
      );

      if (!bgRemovalResult.success || !bgRemovalResult.data) {
        return this.createErrorResult(
          new Error(bgRemovalResult.error?.message || "Background removal failed"),
          { step: "background-removal" },
        );
      }

      // Step 2: Get product dimensions
      const productImage = sharp(bgRemovalResult.data.imageBuffer);
      const productMetadata = await productImage.metadata();
      const productWidth = productMetadata.width || 1000;
      const productHeight = productMetadata.height || 1000;

      // Step 3: Calculate scaling to fit in 1000x1000 with padding
      const padding = input.padding || 50;
      const maxDimension = 1000 - padding * 2;
      const scale = Math.min(maxDimension / productWidth, maxDimension / productHeight);
      const scaledWidth = Math.round(productWidth * scale);
      const scaledHeight = Math.round(productHeight * scale);

      // Step 4: Calculate centering position
      const x = Math.round((1000 - scaledWidth) / 2);
      const y = Math.round((1000 - scaledHeight) / 2);

      // Step 5: Create background canvas
      const bgColor = input.backgroundColor || { r: 255, g: 255, b: 255 };
      const whiteBackground = sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 3,
          background: bgColor,
        },
      });

      // Step 6: Composite product onto background
      const finalImageBuffer = await whiteBackground
        .composite([
          {
            input: await productImage.resize(scaledWidth, scaledHeight).toBuffer(),
            left: x,
            top: y,
          },
        ])
        .png()
        .toBuffer();

      // Step 7: Upload to storage
      const imageUrl = await uploadGeneratedImage(input.userId, input.projectId, "main-image", finalImageBuffer);

      // Step 8: Save to database
      const image = await prisma.generatedImage.create({
        data: {
          projectId: input.projectId,
          url: imageUrl,
          type: ImageType.MAIN_IMAGE,
          width: 1000,
          height: 1000,
          size: finalImageBuffer.length,
        },
      });

      const processingTime = Date.now() - startTime;

      return this.createSuccessResult(
        {
          url: imageUrl,
          width: 1000,
          height: 1000,
          size: finalImageBuffer.length,
          imageId: image.id,
        },
        {
          processingTime,
          originalWidth: productWidth,
          originalHeight: productHeight,
          scale,
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

  async shouldRetry(input: MainImageInput, error: Error, attempt: number): Promise<boolean> {
    if (attempt >= 2) return false; // Limit retries for image generation

    const retryablePatterns = ["network", "timeout", "rate limit", "503", "429"];
    const errorMessage = error.message.toLowerCase();
    return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
  }

  async getCreditsRequired(input: MainImageInput): Promise<number> {
    // Main image generation costs 5 credits (background removal + processing)
    return 5;
  }
}

