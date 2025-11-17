/**
 * Comparison Chart Generation Agent
 * 
 * Generates visual comparison charts showing product vs competitors or feature comparisons.
 */

import { BaseAgent, type AgentContext, type AgentResult } from "../base";
import { createAgentError, AgentErrorCodes } from "../base/AgentError";
import { createInvalidResult, createValidationError } from "../base/ValidationResult";
import { prisma } from "@/lib/db";
import { ImageType } from "@prisma/client";
import { generateImageFromPrompt, downloadGeneratedImage } from "@/lib/ai/imageGeneration";
import { uploadGeneratedImage } from "@/lib/storage";
import { extractFeaturesFromProduct } from "@/lib/ai/featureExtraction";

export interface ComparisonChartInput {
  projectId: string;
  userId: string;
  comparisonType?: "features" | "competitors";
  style?: string;
}

export interface ComparisonChartOutput {
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}

export class ComparisonChartAgent extends BaseAgent<ComparisonChartInput, ComparisonChartOutput> {
  readonly name = "comparison-chart-generator";
  readonly version = "1.0.0";
  readonly description = "Generates comparison charts for Amazon product listings";

  async validate(input: ComparisonChartInput) {
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
    input: ComparisonChartInput,
    context: AgentContext,
  ): Promise<AgentResult<ComparisonChartOutput>> {
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

      // Step 2: Extract features for comparison
      const featureResult = await extractFeaturesFromProduct({
        productName: project.productName,
        description: project.description || undefined,
        category: project.productCategory || undefined,
      });

      // Step 3: Build prompt for comparison chart
      const prompt = this.createComparisonChartPrompt(
        project,
        featureResult.features.slice(0, 5),
        input.comparisonType || "features",
        project.brandKit,
        input.style,
      );

      // Step 4: Generate image using DALL-E 3
      const generatedImages = await generateImageFromPrompt({
        prompt,
        size: "1792x1024",
        quality: "hd",
        style: "vivid",
        n: 1,
      });

      if (!generatedImages || generatedImages.length === 0) {
        throw new Error("Failed to generate comparison chart");
      }

      // Step 5: Download and process image
      const imageBuffer = await downloadGeneratedImage(generatedImages[0]!.url);

      // Step 6: Upload to Supabase Storage
      const imageUrl = await uploadGeneratedImage(
        input.userId,
        input.projectId,
        ImageType.COMPARISON_CHART,
        imageBuffer,
        input.style,
      );

      // Step 7: Create GeneratedImage record
      const generatedImage = await prisma.generatedImage.create({
        data: {
          projectId: input.projectId,
          type: ImageType.COMPARISON_CHART,
          style: input.style || input.comparisonType || "features",
          url: imageUrl,
          width: 1792,
          height: 1024,
          size: imageBuffer.length,
          metadata: {
            comparisonType: input.comparisonType || "features",
            features: featureResult.features.slice(0, 5).map((f) => ({
              title: f.title,
              description: f.description,
            })),
            productName: project.productName,
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
          comparisonType: input.comparisonType || "features",
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

  private createComparisonChartPrompt(
    project: { productName: string; description?: string | null },
    features: Array<{ title: string; description: string }>,
    comparisonType: "features" | "competitors",
    brandKit: { primaryColor?: string | null; secondaryColor?: string | null; accentColor?: string | null } | null,
    style?: string,
  ): string {
    const featureList = features.map((f) => `- ${f.title}: ${f.description}`).join("\n");
    const brandColors = brandKit
      ? `Use brand colors: Primary ${brandKit.primaryColor || "default"}, Secondary ${brandKit.secondaryColor || "default"}`
      : "";

    const comparisonDescription =
      comparisonType === "features"
        ? "Compare key features of this product"
        : "Compare this product with competitors";

    return `Create a professional comparison chart for "${project.productName}".

${comparisonDescription}

Product: ${project.productName}
${project.description ? `Description: ${project.description}` : ""}

Features to Compare:
${featureList}

Design Requirements:
- Clear, easy-to-read comparison format
- Professional chart/grid layout
- Visual emphasis on product advantages
- Amazon listing style
${brandColors}
${style ? `Style: ${style}` : ""}

Make it visually clear and compelling, highlighting why this product is the best choice.`;
  }

  async shouldRetry(input: ComparisonChartInput, error: Error, attempt: number): Promise<boolean> {
    if (attempt >= 2) return false;

    const retryablePatterns = ["network", "timeout", "rate limit", "503", "429"];
    const errorMessage = error.message.toLowerCase();
    return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
  }

  async getCreditsRequired(input: ComparisonChartInput): Promise<number> {
    return 7; // Comparison chart generation costs 7 credits
  }
}

