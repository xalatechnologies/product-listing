/**
 * A+ Content Generation Agent
 * 
 * Generates complete A+ content modules for Amazon listings.
 * Orchestrates content analysis, module generation, and template application.
 */

import { BaseAgent, type AgentContext, type AgentResult } from "../base";
import { createAgentError, AgentErrorCodes } from "../base/AgentError";
import { createInvalidResult, createValidationError } from "../base/ValidationResult";
import { analyzeProductForAPlus, type APLusContentAnalysis, type APLusModuleContent } from "@/lib/aplus/contentAnalysis";
import { getStandardModules, getPremiumModules, type ModuleSpec } from "@/lib/aplus/moduleSpecs";
import { getRandomTemplateForModule, applyBrandKitToTemplate, type APLusModuleTemplate } from "@/lib/aplus/templates";

export interface APlusContentInput {
  /** Project/product name */
  productName: string;
  
  /** Product description */
  description?: string;
  
  /** Product category */
  category?: string;
  
  /** Product images for context */
  productImages?: Array<{ url: string }>;
  
  /** Whether to generate premium modules */
  isPremium?: boolean;
  
  /** Brand kit colors (if available) */
  brandKit?: {
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
  };
  
  /** Whether to generate images for modules */
  generateImages?: boolean;
}

export interface APlusModule {
  type: string;
  templateId?: string;
  content: {
    headline?: string;
    bodyText?: string;
    bullets?: string[];
    sidebar?: string[];
    specifications?: Record<string, string>;
    imageDescriptions?: string[];
  };
  template?: APLusModuleTemplate | null;
}

export interface APlusContentOutput {
  /** Generated modules */
  modules: APlusModule[];
  
  /** Content analysis result */
  analysis: APLusContentAnalysis;
  
  /** Whether premium modules were used */
  isPremium: boolean;
  
  /** Number of modules generated */
  moduleCount: number;
}

export class APlusContentAgent extends BaseAgent<APlusContentInput, APlusContentOutput> {
  readonly name = "aplus-content-generator";
  readonly version = "1.0.0";
  readonly description = "Generates complete Amazon A+ content modules with analysis, templates, and brand kit integration";

  async validate(input: APlusContentInput) {
    const errors = [];

    if (!input.productName || input.productName.trim().length === 0) {
      errors.push(createValidationError("Product name is required", "productName", "REQUIRED"));
    }

    if (input.productName && input.productName.length > 200) {
      errors.push(createValidationError("Product name must be less than 200 characters", "productName", "TOO_LONG"));
    }

    if (errors.length > 0) {
      return createInvalidResult(errors);
    }

    return { valid: true, errors: [] };
  }

  async process(input: APlusContentInput, context: AgentContext): Promise<AgentResult<APlusContentOutput>> {
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

      // Step 1: Analyze product data using GPT-5
      const analysis = await analyzeProductForAPlus({
        productName: input.productName,
        description: input.description,
        category: input.category,
        productImages: input.productImages,
      });

      // Step 2: Select appropriate modules based on premium status
      const availableModules = input.isPremium ? getPremiumModules() : getStandardModules();
      const selectedModules = availableModules.slice(
        0,
        Math.min(6, Math.max(4, analysis.modules.length)),
      );

      // Step 3: Generate modules with templates
      const generatedModules: APlusModule[] = selectedModules.map((moduleSpec: ModuleSpec, index: number) => {
        const moduleContent = analysis.modules[index] || analysis.modules[0]!;
        const template = getRandomTemplateForModule(moduleSpec.id);

        // Apply brand kit if available
        const finalTemplate =
          input.brandKit && template
            ? applyBrandKitToTemplate(template, {
                primaryColor: input.brandKit.primaryColor || undefined,
                secondaryColor: input.brandKit.secondaryColor || undefined,
                accentColor: input.brandKit.accentColor || undefined,
              })
            : template;

        return {
          type: moduleSpec.id,
          templateId: finalTemplate?.id || `default-${moduleSpec.id}`,
          content: {
            headline: moduleContent.headline,
            bodyText: moduleContent.bodyText,
            bullets: moduleContent.additionalContent?.bullets,
            sidebar: moduleContent.additionalContent?.sidebar,
            specifications: moduleContent.additionalContent?.specifications,
            imageDescriptions: moduleContent.imageDescriptions,
          },
          template: finalTemplate ? JSON.parse(JSON.stringify(finalTemplate)) : null,
        };
      });

      const processingTime = Date.now() - startTime;

      return this.createSuccessResult(
        {
          modules: generatedModules,
          analysis,
          isPremium: input.isPremium || false,
          moduleCount: generatedModules.length,
        },
        {
          processingTime,
          moduleTypes: generatedModules.map((m) => m.type),
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

  async shouldRetry(input: APlusContentInput, error: Error, attempt: number): Promise<boolean> {
    if (attempt >= 2) return false; // A+ generation is expensive, limit retries

    // Retry on AI API errors
    const retryablePatterns = ["rate limit", "timeout", "503", "429", "network"];
    const errorMessage = error.message.toLowerCase();
    return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
  }

  async getCreditsRequired(input: APlusContentInput): Promise<number> {
    // A+ content generation costs more credits
    return input.isPremium ? 15 : 10;
  }
}

