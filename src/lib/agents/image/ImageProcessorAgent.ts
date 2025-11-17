/**
 * Image Processor Agent
 * 
 * Processes and enhances images with lighting, sharpness, and background operations.
 * Orchestrates multiple image manipulation operations.
 */

import { BaseAgent, type AgentContext, type AgentResult } from "../base";
import { createAgentError, AgentErrorCodes } from "../base/AgentError";
import { createInvalidResult, createValidationError } from "../base/ValidationResult";
import {
  adjustLighting,
  enhanceSharpness,
  replaceBackground,
  type LightingAdjustmentOptions,
  type SharpnessOptions,
} from "@/lib/ai/imageManipulation";
import sharp from "sharp";

export interface ImageProcessorInput {
  /** Image buffer to process */
  imageBuffer: Buffer;
  
  /** Lighting adjustment options */
  lighting?: LightingAdjustmentOptions;
  
  /** Sharpness enhancement options */
  sharpness?: SharpnessOptions;
  
  /** Replace background with this buffer (requires transparent foreground) */
  replaceBackground?: Buffer;
  
  /** Background fit mode */
  backgroundFit?: "contain" | "cover";
  
  /** Resize options */
  resize?: {
    width?: number;
    height?: number;
    fit?: "contain" | "cover" | "fill";
  };
  
  /** Format conversion */
  format?: "jpeg" | "png" | "webp";
  
  /** Quality (for JPEG/WebP, 1-100) */
  quality?: number;
}

export interface ImageProcessorOutput {
  /** Processed image buffer */
  imageBuffer: Buffer;
  
  /** Image width */
  width: number;
  
  /** Image height */
  height: number;
  
  /** Image format */
  format: string;
  
  /** File size in bytes */
  size: number;
  
  /** Operations applied */
  operations: string[];
}

export class ImageProcessorAgent extends BaseAgent<ImageProcessorInput, ImageProcessorOutput> {
  readonly name = "image-processor";
  readonly version = "1.0.0";
  readonly description = "Processes and enhances images with lighting, sharpness, resize, and format conversion";

  async validate(input: ImageProcessorInput) {
    const errors = [];

    if (!input.imageBuffer || input.imageBuffer.length === 0) {
      errors.push(createValidationError("Image buffer is required", "imageBuffer", "REQUIRED"));
    }

    if (input.resize) {
      if (input.resize.width && input.resize.width <= 0) {
        errors.push(createValidationError("Resize width must be positive", "resize.width", "INVALID"));
      }
      if (input.resize.height && input.resize.height <= 0) {
        errors.push(createValidationError("Resize height must be positive", "resize.height", "INVALID"));
      }
    }

    if (input.quality !== undefined && (input.quality < 1 || input.quality > 100)) {
      errors.push(createValidationError("Quality must be between 1 and 100", "quality", "INVALID"));
    }

    if (errors.length > 0) {
      return createInvalidResult(errors);
    }

    return { valid: true, errors: [] };
  }

  async process(input: ImageProcessorInput, context: AgentContext): Promise<AgentResult<ImageProcessorOutput>> {
    const startTime = Date.now();
    const operations: string[] = [];

    try {
      // Validate input
      const validation = await this.validate(input);
      if (!validation.valid) {
        return this.createErrorResult(
          new Error(validation.errors.map((e) => e.message).join(", ")),
          { validationErrors: validation.errors },
        );
      }

      let processed = input.imageBuffer;
      let image = sharp(processed);

      // Apply lighting adjustments
      if (input.lighting) {
        processed = await adjustLighting(processed, input.lighting);
        image = sharp(processed);
        operations.push("lighting-adjustment");
      }

      // Apply sharpness enhancement
      if (input.sharpness) {
        processed = await enhanceSharpness(processed, input.sharpness);
        image = sharp(processed);
        operations.push("sharpness-enhancement");
      }

      // Replace background if provided
      if (input.replaceBackground) {
        processed = await replaceBackground(processed, input.replaceBackground, input.backgroundFit || "cover");
        image = sharp(processed);
        operations.push("background-replacement");
      }

      // Resize if requested
      if (input.resize) {
        if (input.resize.width || input.resize.height) {
          image = image.resize(input.resize.width, input.resize.height, {
            fit: input.resize.fit || "contain",
          });
          operations.push("resize");
        }
      }

      // Convert format if requested
      if (input.format) {
        switch (input.format) {
          case "jpeg":
            image = image.jpeg({ quality: input.quality || 90 });
            break;
          case "png":
            image = image.png();
            break;
          case "webp":
            image = image.webp({ quality: input.quality || 90 });
            break;
        }
        operations.push(`format-${input.format}`);
      }

      // Get metadata and final buffer
      const metadata = await image.metadata();
      const finalBuffer = await image.toBuffer();

      const processingTime = Date.now() - startTime;

      return this.createSuccessResult(
        {
          imageBuffer: finalBuffer,
          width: metadata.width || 0,
          height: metadata.height || 0,
          format: metadata.format || "unknown",
          size: finalBuffer.length,
          operations,
        },
        {
          processingTime,
          originalFormat: metadata.format,
          originalSize: input.imageBuffer.length,
        },
      );
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const agentError = createAgentError(
        error instanceof Error ? error : new Error(String(error)),
        {
          code: AgentErrorCodes.PROCESSING_ERROR,
          agentName: this.name,
          retryable: false, // Image processing errors are usually not retryable
        },
      );

      return this.createErrorResult(
        error instanceof Error ? error : new Error(String(error)),
        {
          processingTime,
          operations,
          error: agentError,
        },
      );
    }
  }

  async getCreditsRequired(input: ImageProcessorInput): Promise<number> {
    // Image processing is typically free (no AI credits)
    return 0;
  }
}

