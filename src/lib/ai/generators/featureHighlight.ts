/**
 * Feature highlight image generator for Amazon product listings
 * 
 * Generates images that highlight a single product feature with visual emphasis
 */

import { generateImageFromPrompt, downloadGeneratedImage } from "../imageGeneration";
import { uploadGeneratedImage } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { ImageType } from "@prisma/client";
import { extractFeaturesFromProduct } from "../featureExtraction";

export interface FeatureHighlightResult {
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}

/**
 * Generate feature highlight image for Amazon product listing
 */
export async function generateFeatureHighlight(
  projectId: string,
  userId: string,
  featureTitle?: string,
  style?: string,
): Promise<FeatureHighlightResult> {
  // Step 1: Get project data
  const project = await prisma.project.findUnique({
    where: { id: projectId },
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

  // Step 2: Extract or use provided feature
  let featureToHighlight: string;
  if (featureTitle) {
    featureToHighlight = featureTitle;
  } else {
    // Extract features and use the top priority one
    const featureResult = await extractFeaturesFromProduct({
      productName: project.productName,
      description: project.description || undefined,
      category: project.productCategory || undefined,
    });
    featureToHighlight = featureResult.features[0]?.title || "Premium Quality";
  }

  // Step 3: Build prompt for feature highlight
  const prompt = createFeatureHighlightPrompt(
    project,
    featureToHighlight,
    project.brandKit,
    style,
  );

  // Step 4: Generate image using DALL-E 3
  const generatedImages = await generateImageFromPrompt({
    prompt,
    size: "1024x1024", // Square format for feature highlights
    quality: "hd",
    style: "vivid",
    n: 1,
  });

  if (!generatedImages || generatedImages.length === 0) {
    throw new Error("Failed to generate feature highlight image");
  }

  // Step 5: Download and process image
  const imageBuffer = await downloadGeneratedImage(generatedImages[0]!.url);

  // Step 6: Upload to Supabase Storage
  const imageUrl = await uploadGeneratedImage(
    userId,
    projectId,
    ImageType.FEATURE_HIGHLIGHT,
    imageBuffer,
    style,
  );

  // Step 7: Create GeneratedImage record
  const generatedImage = await prisma.generatedImage.create({
    data: {
      projectId,
      type: ImageType.FEATURE_HIGHLIGHT,
      style: style || "default",
      url: imageUrl,
      width: 1024,
      height: 1024,
      size: imageBuffer.length,
      metadata: {
        featureTitle: featureToHighlight,
        productName: project.productName,
        revisedPrompt: generatedImages[0]!.revisedPrompt,
      },
    },
  });

  return {
    url: imageUrl,
    width: 1024,
    height: 1024,
    size: imageBuffer.length,
    imageId: generatedImage.id,
  };
}

/**
 * Create prompt for feature highlight generation
 */
function createFeatureHighlightPrompt(
  project: {
    productName: string;
    description?: string | null;
  },
  featureTitle: string,
  brandKit?: {
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
  } | null,
  style?: string,
): string {
  const brandColors = brandKit
    ? `Brand colors: Primary ${brandKit.primaryColor || "#0066CC"}, Secondary ${brandKit.secondaryColor || "#333333"}, Accent ${brandKit.accentColor || "#FF6600"}.`
    : "";

  const styleDescription = style === "premium"
    ? "premium, luxurious, high-end"
    : style === "minimal"
      ? "minimalist, clean, simple"
      : style === "bold"
        ? "bold, vibrant, eye-catching"
        : "professional, modern, clean";

  return `Create a professional Amazon product listing feature highlight image for "${project.productName}".

Feature to Highlight: "${featureTitle}"

${project.description ? `Product Description: ${project.description}` : ""}

Design Requirements:
- Size: 1024x1024px square format
- Style: ${styleDescription} e-commerce design
- Feature "${featureTitle}" should be prominently displayed and visually emphasized
- Use large, bold text for the feature title
- Include visual elements that represent the feature (icons, graphics, or illustrations)
- High contrast for readability
- Amazon-compliant design (no watermarks, logos, or text overlays that violate guidelines)
${brandColors}
- Background should complement the feature and product
- Professional, conversion-optimized design

The image should clearly communicate the feature benefit to potential customers.`;
}

