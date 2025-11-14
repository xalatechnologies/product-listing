/**
 * A+ Content Image Generation Service
 * 
 * Generates images for A+ content modules based on image descriptions
 */

import { generateImageFromPrompt, ImageGenerationOptions, downloadGeneratedImage } from "@/lib/ai/imageGeneration";
import { uploadGeneratedImage } from "@/lib/storage";
import { ImageType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { applyImageEnhancements } from "@/lib/ai/imageManipulation";
import sharp from "sharp";

export interface APLusImageGenerationResult {
  imageId: string;
  url: string;
  description: string;
  width: number;
  height: number;
  size: number;
}

/**
 * Parse image description to extract generation instructions
 */
export function parseImageDescription(description: string): {
  prompt: string;
  enhancements: {
    removeBackground?: boolean;
    adjustLighting?: boolean;
    enhanceSharpness?: boolean;
    createMockup?: boolean;
    createLiveImage?: boolean;
    createComparison?: boolean;
  };
} {
  const lowerDesc = description.toLowerCase();
  
  const enhancements = {
    removeBackground: lowerDesc.includes("remove background") || lowerDesc.includes("remove bg"),
    adjustLighting: lowerDesc.includes("lighting") || lowerDesc.includes("brightness") || lowerDesc.includes("exposure"),
    enhanceSharpness: lowerDesc.includes("sharpness") || lowerDesc.includes("sharp") || lowerDesc.includes("clear"),
    createMockup: lowerDesc.includes("mockup") || lowerDesc.includes("mock up"),
    createLiveImage: lowerDesc.includes("live image") || lowerDesc.includes("lifestyle"),
    createComparison: lowerDesc.includes("comparison") || lowerDesc.includes("compare") || lowerDesc.includes("vs"),
  };

  // Clean up the prompt by removing instruction keywords
  let prompt = description
    .replace(/create\s+live\s+image/gi, "")
    .replace(/create\s+mockup\s+image/gi, "")
    .replace(/create\s+how\s+to\s+use\s+image/gi, "")
    .replace(/remove\s+background/gi, "")
    .replace(/remove\s+bg/gi, "")
    .replace(/adjust\s+lighting/gi, "")
    .replace(/enhance\s+sharpness/gi, "")
    .replace(/make\s+good\s+sharpness/gi, "")
    .trim();

  return { prompt, enhancements };
}

/**
 * Generate image for A+ content module
 */
export async function generateAPlusImage(
  projectId: string,
  userId: string,
  description: string,
  productName: string,
  productImageUrl?: string,
): Promise<APLusImageGenerationResult> {
  // Parse description to extract prompt and enhancements
  const { prompt, enhancements } = parseImageDescription(description);

  // Build the final prompt
  let finalPrompt = prompt;
  
  if (enhancements.createLiveImage) {
    finalPrompt = `Professional lifestyle photograph: ${finalPrompt}. High quality, well-lit, natural setting, product in use.`;
  } else if (enhancements.createMockup) {
    finalPrompt = `Professional product mockup: ${finalPrompt}. Clean background, studio lighting, commercial photography style.`;
  } else if (enhancements.createComparison) {
    finalPrompt = `Comparison image: ${finalPrompt}. Side-by-side comparison, clear visual differences highlighted.`;
  } else {
    finalPrompt = `Professional product image: ${finalPrompt}. High quality, well-composed, commercial photography.`;
  }

  // Add product name context if available
  if (productName) {
    finalPrompt = `${finalPrompt} Product: ${productName}.`;
  }

  // Determine image size based on type
  let size: ImageGenerationOptions["size"] = "1024x1024";
  if (enhancements.createLiveImage || enhancements.createComparison) {
    size = "1792x1024"; // Wide format for lifestyle/comparison
  }

  // Generate image using DALL-E 3
  const generatedImages = await generateImageFromPrompt({
    prompt: finalPrompt,
    size,
    quality: "hd",
    style: enhancements.createLiveImage ? "natural" : "vivid",
    n: 1,
  });

  if (!generatedImages || generatedImages.length === 0) {
    throw new Error("Failed to generate image");
  }

  // Download the generated image
  let imageBuffer = await downloadGeneratedImage(generatedImages[0]!.url);

  // Apply enhancements
  if (enhancements.enhanceSharpness) {
    imageBuffer = await applyImageEnhancements(imageBuffer, {
      sharpness: { amount: 70, radius: 1.2 },
    });
  }

  if (enhancements.adjustLighting) {
    imageBuffer = await applyImageEnhancements(imageBuffer, {
      lighting: {
        brightness: 10,
        contrast: 15,
        exposure: 5,
      },
    });
  }

  // Get image dimensions
  const imageMeta = await sharp(imageBuffer).metadata();
  const width = imageMeta.width || 1024;
  const height = imageMeta.height || 1024;
  const sizeBytes = imageBuffer.length;

  // Upload to Supabase Storage
  const imageUrl = await uploadGeneratedImage(
    userId,
    projectId,
    ImageType.A_PLUS_MODULE,
    imageBuffer,
  );

  // Create GeneratedImage record
  const generatedImage = await prisma.generatedImage.create({
    data: {
      projectId,
      type: ImageType.A_PLUS_MODULE,
      url: imageUrl,
      width,
      height,
      size: sizeBytes,
      metadata: {
        description,
        prompt: finalPrompt,
        enhancements,
        source: "aplus-generation",
      },
    },
  });

  return {
    imageId: generatedImage.id,
    url: imageUrl,
    description,
    width,
    height,
    size: sizeBytes,
  };
}

/**
 * Generate images for all A+ content modules
 */
export async function generateAPlusModuleImages(
  projectId: string,
  userId: string,
  modules: Array<{
    content: {
      imageDescriptions?: string[];
    };
  }>,
  productName: string,
  productImageUrl?: string,
): Promise<APLusImageGenerationResult[]> {
  const results: APLusImageGenerationResult[] = [];

  for (const module of modules) {
    const descriptions = module.content.imageDescriptions || [];
    
    for (const description of descriptions) {
      try {
        const result = await generateAPlusImage(
          projectId,
          userId,
          description,
          productName,
          productImageUrl,
        );
        results.push(result);
      } catch (error) {
        console.error(`Failed to generate image for description "${description}":`, error);
        // Continue with other images even if one fails
      }
    }
  }

  return results;
}

/**
 * Generate comparison image for A+ content
 */
export async function generateComparisonImage(
  projectId: string,
  userId: string,
  productName: string,
  comparisonData: Array<{ feature: string; value: string }>,
  productImageUrl?: string,
): Promise<APLusImageGenerationResult> {
  // Build comparison prompt
  const comparisonFeatures = comparisonData
    .map((item) => `${item.feature}: ${item.value}`)
    .join(", ");

  const prompt = `Professional comparison image showing ${productName} advantages. Side-by-side visual comparison highlighting: ${comparisonFeatures}. Clean, professional design, easy to read labels, commercial photography style.`;

  // Generate comparison image
  const generatedImages = await generateImageFromPrompt({
    prompt,
    size: "1792x1024",
    quality: "hd",
    style: "vivid",
    n: 1,
  });

  if (!generatedImages || generatedImages.length === 0) {
    throw new Error("Failed to generate comparison image");
  }

  // Download and process
  let imageBuffer = await downloadGeneratedImage(generatedImages[0]!.url);

  // Enhance for clarity
  imageBuffer = await applyImageEnhancements(imageBuffer, {
    sharpness: { amount: 60 },
    lighting: { contrast: 10 },
  });

  // Get dimensions
  const imageMeta = await sharp(imageBuffer).metadata();
  const width = imageMeta.width || 1792;
  const height = imageMeta.height || 1024;
  const sizeBytes = imageBuffer.length;

  // Upload
  const imageUrl = await uploadGeneratedImage(
    userId,
    projectId,
    ImageType.COMPARISON_CHART,
    imageBuffer,
  );

  // Create record
  const generatedImage = await prisma.generatedImage.create({
    data: {
      projectId,
      type: ImageType.COMPARISON_CHART,
      url: imageUrl,
      width,
      height,
      size: sizeBytes,
      metadata: {
        description: `Comparison image for ${productName}`,
        prompt,
        comparisonData,
        source: "aplus-comparison",
      },
    },
  });

  return {
    imageId: generatedImage.id,
    url: imageUrl,
    description: `Comparison: ${productName}`,
    width,
    height,
    size: sizeBytes,
  };
}

