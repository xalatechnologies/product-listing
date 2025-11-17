/**
 * Infographic Generation Agent
 * 
 * Generates infographics for Amazon product listings using AI image generation.
 */

import { BaseAgent, type AgentContext, type AgentResult } from "../base";
import { createAgentError, AgentErrorCodes } from "../base/AgentError";
import { createInvalidResult, createValidationError } from "../base/ValidationResult";
import { prisma } from "@/lib/db";
import { ImageType } from "@prisma/client";
import { generateImageFromPrompt, downloadGeneratedImage } from "@/lib/ai/imageGeneration";
import { uploadGeneratedImage } from "@/lib/storage";
import { extractFeaturesFromProduct, formatFeaturesForInfographic } from "@/lib/ai/featureExtraction";
import {
  getTemplate,
  getRandomTemplate,
  applyBrandKitToTemplate,
  type InfographicTemplate,
} from "@/lib/ai/templates/infographicTemplates";
import { generateLayoutJSON, applyBrandColors } from "@/lib/ai/layoutEngine";

export interface InfographicInput {
  projectId: string;
  userId: string;
  templateId?: string;
  style?: string;
}

export interface InfographicOutput {
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}

export class InfographicAgent extends BaseAgent<InfographicInput, InfographicOutput> {
  readonly name = "infographic-generator";
  readonly version = "1.0.0";
  readonly description = "Generates infographics for Amazon product listings with features and branding";

  async validate(input: InfographicInput) {
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

  async process(input: InfographicInput, context: AgentContext): Promise<AgentResult<InfographicOutput>> {
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

      // Step 2: Extract features using GPT-5
      const featureResult = await extractFeaturesFromProduct({
        productName: project.productName,
        description: project.description || undefined,
        category: project.productCategory || undefined,
      });

      const features = formatFeaturesForInfographic(featureResult.features, 6);

      // Step 3: Select template
      const template = input.templateId
        ? getTemplate(input.templateId) || getRandomTemplate()
        : getRandomTemplate();

      // Step 4: Apply brand kit colors if available
      let finalTemplate = template;
      if (project.brandKit) {
        finalTemplate = applyBrandKitToTemplate(template, {
          primaryColor: project.brandKit.primaryColor || undefined,
          secondaryColor: project.brandKit.secondaryColor || undefined,
          accentColor: project.brandKit.accentColor || undefined,
        });
        finalTemplate = applyBrandColors(finalTemplate, {
          primaryColor: project.brandKit.primaryColor || undefined,
          secondaryColor: project.brandKit.secondaryColor || undefined,
          accentColor: project.brandKit.accentColor || undefined,
        });
      }

      // Step 5: Generate layout JSON
      const layout = generateLayoutJSON(finalTemplate, {
        title: project.productName,
        features,
        productImageUrl: project.productImages[0]?.url,
        ctaText: "Shop Now",
      });

      // Step 6: Create prompt for AI image generation
      const prompt = this.createInfographicPrompt(project, features, finalTemplate, layout);

      // Step 7: Generate image using DALL-E 3
      const generatedImages = await generateImageFromPrompt({
        prompt,
        size: "1024x1792",
        quality: "hd",
        style: "vivid",
        n: 1,
      });

      if (!generatedImages || generatedImages.length === 0) {
        throw new Error("Failed to generate infographic image");
      }

      // Step 8: Download and process image
      const imageBuffer = await downloadGeneratedImage(generatedImages[0]!.url);

      // Step 9: Upload to Supabase Storage
      const imageUrl = await uploadGeneratedImage(
        input.userId,
        input.projectId,
        ImageType.INFOGRAPHIC,
        imageBuffer,
        input.style,
      );

      // Step 10: Create GeneratedImage record
      const generatedImage = await prisma.generatedImage.create({
        data: {
          projectId: input.projectId,
          type: ImageType.INFOGRAPHIC,
          style: input.style || "default",
          url: imageUrl,
          width: 1024,
          height: 1792,
          size: imageBuffer.length,
          metadata: {
            templateId: finalTemplate.id,
            features: features.map((f) => ({ title: f.title, description: f.description })),
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
          height: 1792,
          size: imageBuffer.length,
          imageId: generatedImage.id,
        },
        {
          processingTime,
          templateId: finalTemplate.id,
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

  private createInfographicPrompt(
    project: { productName: string; description?: string | null },
    features: Array<{ title: string; description: string }>,
    template: InfographicTemplate,
    layout: unknown,
  ): string {
    const featureList = features.map((f) => `- ${f.title}: ${f.description}`).join("\n");

    return `Create a professional infographic for "${project.productName}".

Product Description: ${project.description || "Premium quality product"}

Key Features to Highlight:
${featureList}

Design Requirements:
- Professional, modern design
- Clear typography and hierarchy
- Use brand colors from template
- Include product image if available
- Make it visually appealing and easy to scan
- Follow the layout structure provided

Style: Clean, professional, Amazon listing style`;
  }

  async shouldRetry(input: InfographicInput, error: Error, attempt: number): Promise<boolean> {
    if (attempt >= 2) return false;

    const retryablePatterns = ["network", "timeout", "rate limit", "503", "429"];
    const errorMessage = error.message.toLowerCase();
    return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
  }

  async getCreditsRequired(input: InfographicInput): Promise<number> {
    return 8; // Infographic generation costs 8 credits
  }
}

