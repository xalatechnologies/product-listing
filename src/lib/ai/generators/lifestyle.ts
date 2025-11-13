/**
 * Lifestyle image generator for Amazon product listings
 * 
 * Generates realistic lifestyle scenes featuring the product in use
 */

import { generateImageFromPrompt, downloadGeneratedImage } from "../imageGeneration";
import { uploadGeneratedImage } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { ImageType } from "@prisma/client";

export interface LifestyleResult {
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}

/**
 * Generate lifestyle image for Amazon product listing
 */
export async function generateLifestyle(
  projectId: string,
  userId: string,
  sceneDescription?: string,
  style?: string,
): Promise<LifestyleResult> {
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

  const productImageUrl = project.productImages[0]!.url;

  // Step 2: Build prompt for lifestyle scene
  const prompt = createLifestylePrompt(
    project,
    productImageUrl,
    sceneDescription,
    project.brandKit,
    style,
  );

  // Step 3: Generate image using DALL-E 3
  const generatedImages = await generateImageFromPrompt({
    prompt,
    size: "1792x1024", // Wide format for lifestyle scenes
    quality: "hd",
    style: "natural",
    n: 1,
  });

  if (!generatedImages || generatedImages.length === 0) {
    throw new Error("Failed to generate lifestyle image");
  }

  // Step 4: Download and process image
  const imageBuffer = await downloadGeneratedImage(generatedImages[0]!.url);

  // Step 5: Upload to Supabase Storage
  const imageUrl = await uploadGeneratedImage(
    userId,
    projectId,
    ImageType.LIFESTYLE,
    imageBuffer,
    style,
  );

  // Step 6: Create GeneratedImage record
  const generatedImage = await prisma.generatedImage.create({
    data: {
      projectId,
      type: ImageType.LIFESTYLE,
      style: style || "default",
      url: imageUrl,
      width: 1792,
      height: 1024,
      size: imageBuffer.length,
      metadata: {
        sceneDescription: sceneDescription || "default",
        productName: project.productName,
        productImageUrl,
        revisedPrompt: generatedImages[0]!.revisedPrompt,
      },
    },
  });

  return {
    url: imageUrl,
    width: 1792,
    height: 1024,
    size: imageBuffer.length,
    imageId: generatedImage.id,
  };
}

/**
 * Create prompt for lifestyle image generation
 */
function createLifestylePrompt(
  project: {
    productName: string;
    description?: string | null;
    productCategory?: string | null;
  },
  productImageUrl: string,
  sceneDescription?: string,
  brandKit?: {
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
  } | null,
  style?: string,
): string {
  // Generate scene description based on product category if not provided
  let scene = sceneDescription;
  if (!scene) {
    const category = project.productCategory?.toLowerCase() || "";
    if (category.includes("home") || category.includes("kitchen")) {
      scene = "modern home interior, natural lighting, cozy atmosphere";
    } else if (category.includes("outdoor") || category.includes("sport")) {
      scene = "outdoor setting, natural environment, active lifestyle";
    } else if (category.includes("tech") || category.includes("electronic")) {
      scene = "modern workspace or home office, clean and organized";
    } else if (category.includes("fashion") || category.includes("clothing")) {
      scene = "stylish urban setting, contemporary lifestyle";
    } else {
      scene = "professional lifestyle setting, natural and appealing";
    }
  }

  const brandColors = brandKit
    ? `Incorporate brand colors subtly: Primary ${brandKit.primaryColor || "#0066CC"}, Secondary ${brandKit.secondaryColor || "#333333"}, Accent ${brandKit.accentColor || "#FF6600"}.`
    : "";

  const styleDescription = style === "premium"
    ? "premium, luxurious, high-end lifestyle"
    : style === "casual"
      ? "casual, relaxed, everyday lifestyle"
      : style === "professional"
        ? "professional, sophisticated lifestyle"
        : "natural, authentic, appealing lifestyle";

  return `Create a professional Amazon product listing lifestyle image featuring "${project.productName}".

${project.description ? `Product Description: ${project.description}` : ""}

Product Image Reference: ${productImageUrl}
Use this product image as reference for accurate product appearance and details.

Scene Requirements:
- Setting: ${scene}
- Style: ${styleDescription}
- Size: 1792x1024px wide format
- The product should be naturally integrated into the scene
- Show the product being used or displayed in a realistic, appealing way
- Natural lighting and authentic atmosphere
- High quality, professional photography style
- Amazon-compliant (no watermarks, logos, or text overlays)
${brandColors}
- Focus on showing the product in a way that helps customers visualize owning and using it
- Create an emotional connection with potential buyers

The image should make customers want to own this product by showing it in an aspirational yet relatable context.`;
}

