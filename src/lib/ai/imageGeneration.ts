/**
 * AI image generation service integration
 * 
 * Supports multiple providers:
 * - OpenAI DALL-E 3 (primary)
 * - Replicate Stable Diffusion (alternative)
 */

import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize OpenAI client
const openai = OPENAI_API_KEY
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

export interface ImageGenerationOptions {
  prompt: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
  n?: number; // Number of images to generate (1-10)
}

export interface GeneratedImage {
  url: string;
  revisedPrompt?: string;
}

/**
 * Generate image from text prompt using DALL-E 3
 * @param options - Generation options
 * @returns Array of generated image URLs
 */
export async function generateImageFromPrompt(
  options: ImageGenerationOptions,
): Promise<GeneratedImage[]> {
  if (!openai) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: options.prompt,
      size: options.size || "1024x1024",
      quality: options.quality || "standard",
      style: options.style || "natural",
      n: options.n || 1,
    });

    return response.data.map((image) => ({
      url: image.url!,
      revisedPrompt: "revised_prompt" in image ? image.revised_prompt : undefined,
    }));
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Generate image from product image (img2img) using DALL-E 3
 * Note: DALL-E 3 doesn't support img2img directly, so we use the product image
 * as context in the prompt and generate a new image
 * @param productImageUrl - URL of the product image
 * @param prompt - Text prompt describing desired output
 * @param options - Additional generation options
 * @returns Generated image URL
 */
export async function generateImageFromProductImage(
  productImageUrl: string,
  prompt: string,
  options?: Omit<ImageGenerationOptions, "prompt">,
): Promise<GeneratedImage[]> {
  // DALL-E 3 doesn't support direct img2img, so we enhance the prompt
  // with product image context
  const enhancedPrompt = `${prompt}. Use the product image at ${productImageUrl} as reference for the product appearance.`;

  return generateImageFromPrompt({
    prompt: enhancedPrompt,
    ...options,
  });
}

/**
 * Download generated image and return as buffer
 * @param imageUrl - URL of the generated image
 * @returns Image buffer
 */
export async function downloadGeneratedImage(imageUrl: string): Promise<Buffer> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

/**
 * Rate limiting helper (simple in-memory implementation)
 * In production, use Redis or similar for distributed rate limiting
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  userId: string,
  limit: number = 10,
  windowMs: number = 60000, // 1 minute
): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (userLimit.count >= limit) {
    return false;
  }

  userLimit.count++;
  return true;
}

