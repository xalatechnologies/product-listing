/**
 * Comparison chart generator for Amazon product listings
 * 
 * Generates visual comparison charts showing product vs competitors or feature comparisons
 */

import { generateImageFromPrompt, downloadGeneratedImage } from "../imageGeneration";
import { uploadGeneratedImage } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { ImageType } from "@prisma/client";
import { extractFeaturesFromProduct } from "../featureExtraction";

export interface ComparisonChartResult {
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}

/**
 * Generate comparison chart for Amazon product listing
 */
export async function generateComparisonChart(
  projectId: string,
  userId: string,
  comparisonType: "features" | "competitors" = "features",
  style?: string,
): Promise<ComparisonChartResult> {
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

  // Step 2: Extract features for comparison
  const featureResult = await extractFeaturesFromProduct({
    productName: project.productName,
    description: project.description || undefined,
    category: project.productCategory || undefined,
  });

  // Step 3: Build prompt for comparison chart
  const prompt = createComparisonChartPrompt(
    project,
    featureResult.features.slice(0, 5), // Top 5 features
    comparisonType,
    project.brandKit,
    style,
  );

  // Step 4: Generate image using DALL-E 3
  const generatedImages = await generateImageFromPrompt({
    prompt,
    size: "1792x1024", // Wide format for charts
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
    userId,
    projectId,
    ImageType.COMPARISON_CHART,
    imageBuffer,
    style,
  );

  // Step 7: Create GeneratedImage record
  const generatedImage = await prisma.generatedImage.create({
    data: {
      projectId,
      type: ImageType.COMPARISON_CHART,
      style: style || comparisonType,
      url: imageUrl,
      width: 1792,
      height: 1024,
      size: imageBuffer.length,
      metadata: {
        comparisonType,
        features: featureResult.features.slice(0, 5).map((f) => ({
          title: f.title,
          description: f.description,
        })),
        productName: project.productName,
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
 * Create prompt for comparison chart generation
 */
function createComparisonChartPrompt(
  project: {
    productName: string;
    description?: string | null;
  },
  features: Array<{ title: string; description: string }>,
  comparisonType: "features" | "competitors",
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

  const styleDescription = style === "minimal"
    ? "minimalist, clean chart design"
    : style === "bold"
      ? "bold, vibrant chart design"
      : "professional, clear, easy-to-read chart design";

  if (comparisonType === "features") {
    const featureList = features.map((f) => `- ${f.title}: ${f.description}`).join("\n");

    return `Create a professional Amazon product listing comparison chart for "${project.productName}".

${project.description ? `Product Description: ${project.description}` : ""}

Feature Comparison:
${featureList}

Design Requirements:
- Size: 1792x1024px wide format
- Style: ${styleDescription}
- Create a visual comparison chart showing how "${project.productName}" compares favorably
- Use clear visual elements: checkmarks, icons, or comparison bars
- Highlight key advantages and features
- High contrast for readability
- Amazon-compliant design (no watermarks or logos)
${brandColors}
- Professional e-commerce chart design
- Easy to scan and understand at a glance

The chart should clearly show why this product is superior or has key advantages.`;
  } else {
    // Competitors comparison
    return `Create a professional Amazon product listing comparison chart for "${project.productName}" vs competitors.

${project.description ? `Product Description: ${project.description}` : ""}

Key Features to Compare:
${features.map((f) => `- ${f.title}: ${f.description}`).join("\n")}

Design Requirements:
- Size: 1792x1024px wide format
- Style: ${styleDescription}
- Create a side-by-side comparison chart
- Show "${project.productName}" vs 2-3 generic competitors
- Use visual elements: comparison bars, checkmarks, or feature grids
- Highlight where "${project.productName}" excels
- High contrast for readability
- Amazon-compliant design (no watermarks, logos, or competitor brand names)
${brandColors}
- Professional e-commerce comparison design
- Clear visual hierarchy showing product advantages

The chart should help customers quickly see why "${project.productName}" is the better choice.`;
  }
}

