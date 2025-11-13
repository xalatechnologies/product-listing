/**
 * Prompt templates for main image generation
 * 
 * Note: Main images are generated using background removal + compositing,
 * not AI generation. These prompts are for reference and future enhancements.
 */

/**
 * Amazon main image requirements:
 * - White background (RGB 255, 255, 255)
 * - Exactly 1000x1000px
 * - Product should fill at least 85% of the image
 * - Product should be centered
 * - No text, logos, or watermarks
 * - No lifestyle scenes or props
 * - High quality, professional photography
 */

export interface MainImagePromptOptions {
  productName: string;
  productDescription?: string;
  productCategory?: string;
}

/**
 * Generate prompt for main image (for AI-based generation if needed)
 * Currently unused as we use background removal + compositing
 */
export function generateMainImagePrompt(
  options: MainImagePromptOptions,
): string {
  const { productName, productDescription, productCategory } = options;

  let prompt = `Professional product photography of ${productName}`;

  if (productDescription) {
    prompt += `, ${productDescription}`;
  }

  if (productCategory) {
    prompt += ` in the ${productCategory} category`;
  }

  prompt +=
    ". Pure white background (RGB 255, 255, 255), exactly 1000x1000 pixels, product centered, high quality, professional lighting, no text, no logos, no watermarks, no props, no lifestyle elements, product fills at least 85% of the frame.";

  return prompt;
}

/**
 * DALL-E 3 optimized prompt for main image
 */
export function generateDALLE3MainImagePrompt(
  options: MainImagePromptOptions,
): string {
  const basePrompt = generateMainImagePrompt(options);
  // DALL-E 3 specific optimizations
  return `${basePrompt} Style: clean, minimalist, e-commerce product photography.`;
}

/**
 * Stable Diffusion optimized prompt for main image
 */
export function generateStableDiffusionMainImagePrompt(
  options: MainImagePromptOptions,
): string {
  const { productName, productDescription } = options;
  // Stable Diffusion uses different prompt structure
  return `professional product photography, ${productName}${productDescription ? `, ${productDescription}` : ""}, white background, studio lighting, high quality, 1000x1000, centered, no text, no logo, product photography, e-commerce`;
}

