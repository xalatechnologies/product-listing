/**
 * Background Removal Agent
 * 
 * Removes background from images using Remove.bg API or Replicate.
 * Implements fallback strategy and retry logic.
 */

import { BaseAgent, createAgentContext, type AgentContext, type AgentResult } from "../base";
import { createAgentError, AgentErrorCodes } from "../base/AgentError";
import { createInvalidResult, createValidationError } from "../base/ValidationResult";
import { removeBackground, removeBackgroundReplicate } from "@/lib/ai/backgroundRemoval";

export interface BackgroundRemovalInput {
  /** URL of the image to process */
  imageUrl: string;
  
  /** Preferred provider: 'removebg' | 'replicate' | 'auto' */
  provider?: "removebg" | "replicate" | "auto";
  
  /** Maximum retries */
  maxRetries?: number;
}

export interface BackgroundRemovalOutput {
  /** Processed image buffer */
  imageBuffer: Buffer;
  
  /** Image width */
  width: number;
  
  /** Image height */
  height: number;
  
  /** Provider used */
  provider: "removebg" | "replicate";
}

export class BackgroundRemovalAgent extends BaseAgent<BackgroundRemovalInput, BackgroundRemovalOutput> {
  readonly name = "background-removal";
  readonly version = "1.0.0";
  readonly description = "Removes background from images using Remove.bg or Replicate API";

  async validate(input: BackgroundRemovalInput) {
    const errors = [];

    if (!input.imageUrl) {
      errors.push(createValidationError("Image URL is required", "imageUrl", "REQUIRED"));
    } else if (!input.imageUrl.startsWith("http://") && !input.imageUrl.startsWith("https://")) {
      errors.push(createValidationError("Image URL must be a valid HTTP/HTTPS URL", "imageUrl", "INVALID_URL"));
    }

    if (input.provider && !["removebg", "replicate", "auto"].includes(input.provider)) {
      errors.push(createValidationError("Provider must be 'removebg', 'replicate', or 'auto'", "provider", "INVALID_PROVIDER"));
    }

    if (errors.length > 0) {
      return createInvalidResult(errors);
    }

    return { valid: true, errors: [] };
  }

  async process(input: BackgroundRemovalInput, context: AgentContext): Promise<AgentResult<BackgroundRemovalOutput>> {
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

      const provider = input.provider || "auto";
      let result: BackgroundRemovalOutput;
      let lastError: Error | null = null;

      // Try providers based on preference
      if (provider === "removebg" || provider === "auto") {
        try {
          const removeBgResult = await removeBackground(input.imageUrl);
          result = {
            imageBuffer: removeBgResult.imageBuffer,
            width: removeBgResult.width,
            height: removeBgResult.height,
            provider: "removebg",
          };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          // If auto and removebg fails, try replicate
          if (provider === "auto") {
            try {
              const replicateResult = await removeBackgroundReplicate(input.imageUrl);
              result = {
                imageBuffer: replicateResult.imageBuffer,
                width: replicateResult.width,
                height: replicateResult.height,
                provider: "replicate",
              };
            } catch (replicateError) {
              throw lastError; // Throw original error
            }
          } else {
            throw lastError;
          }
        }
      } else {
        // Use Replicate
        const replicateResult = await removeBackgroundReplicate(input.imageUrl);
        result = {
          imageBuffer: replicateResult.imageBuffer,
          width: replicateResult.width,
          height: replicateResult.height,
          provider: "replicate",
        };
      }

      const processingTime = Date.now() - startTime;

      return this.createSuccessResult(result, {
        processingTime,
        provider: result.provider,
      });
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const agentError = createAgentError(
        error instanceof Error ? error : new Error(String(error)),
        {
          code: AgentErrorCodes.PROCESSING_ERROR,
          agentName: this.name,
          retryable: await this.shouldRetry(input, error instanceof Error ? error : new Error(String(error)), 0),
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

  async shouldRetry(input: BackgroundRemovalInput, error: Error, attempt: number): Promise<boolean> {
    if (attempt >= (input.maxRetries || 3)) return false;

    // Retry on network errors or rate limits
    const retryablePatterns = [
      "network",
      "timeout",
      "rate limit",
      "ECONNRESET",
      "ETIMEDOUT",
      "503",
      "429",
    ];

    const errorMessage = error.message.toLowerCase();
    return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
  }

  async getCreditsRequired(input: BackgroundRemovalInput): Promise<number> {
    // Background removal typically costs 1 credit
    return 1;
  }
}

