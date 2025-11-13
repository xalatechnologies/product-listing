/**
 * Dimension diagram generator for Amazon product listings
 * 
 * Generates technical dimension diagrams showing product measurements
 */

import { generateImageFromPrompt, downloadGeneratedImage } from "../imageGeneration";
import { uploadGeneratedImage } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { ImageType } from "@prisma/client";

export interface DimensionDiagramResult {
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}

/**
 * Generate dimension diagram for Amazon product listing
 */
export async function generateDimensionDiagram(
  projectId: string,
  userId: string,
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    unit?: string;
  },
  style?: string,
): Promise<DimensionDiagramResult> {
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

  // Step 2: Extract dimensions from metadata or use provided
  // For now, we'll use provided dimensions or generate a generic diagram
  const productDimensions = dimensions || {
    length: undefined,
    width: undefined,
    height: undefined,
    weight: undefined,
    unit: "inches",
  };

  // Step 3: Build prompt for dimension diagram
  const prompt = createDimensionDiagramPrompt(
    project,
    productImageUrl,
    productDimensions,
    project.brandKit,
    style,
  );

  // Step 4: Generate image using DALL-E 3
  const generatedImages = await generateImageFromPrompt({
    prompt,
    size: "1024x1792", // Tall format for dimension diagrams
    quality: "hd",
    style: "natural",
    n: 1,
  });

  if (!generatedImages || generatedImages.length === 0) {
    throw new Error("Failed to generate dimension diagram");
  }

  // Step 5: Download and process image
  const imageBuffer = await downloadGeneratedImage(generatedImages[0]!.url);

  // Step 6: Upload to Supabase Storage
  const imageUrl = await uploadGeneratedImage(
    userId,
    projectId,
    ImageType.DIMENSION_DIAGRAM,
    imageBuffer,
    style,
  );

  // Step 7: Create GeneratedImage record
  const generatedImage = await prisma.generatedImage.create({
    data: {
      projectId,
      type: ImageType.DIMENSION_DIAGRAM,
      style: style || "technical",
      url: imageUrl,
      width: 1024,
      height: 1792,
      size: imageBuffer.length,
      metadata: {
        dimensions: productDimensions,
        productName: project.productName,
        productImageUrl,
        revisedPrompt: generatedImages[0]!.revisedPrompt,
      },
    },
  });

  return {
    url: imageUrl,
    width: 1024,
    height: 1792,
    size: imageBuffer.length,
    imageId: generatedImage.id,
  };
}

/**
 * Create prompt for dimension diagram generation
 */
function createDimensionDiagramPrompt(
  project: {
    productName: string;
    description?: string | null;
  },
  productImageUrl: string,
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    unit?: string;
  },
  brandKit?: {
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
  } | null,
  style?: string,
): string {
  const unit = dimensions.unit || "inches";
  const dimensionText: string[] = [];

  if (dimensions.length) {
    dimensionText.push(`Length: ${dimensions.length} ${unit}`);
  }
  if (dimensions.width) {
    dimensionText.push(`Width: ${dimensions.width} ${unit}`);
  }
  if (dimensions.height) {
    dimensionText.push(`Height: ${dimensions.height} ${unit}`);
  }
  if (dimensions.weight) {
    dimensionText.push(`Weight: ${dimensions.weight} ${dimensions.unit === "inches" ? "lbs" : "kg"}`);
  }

  // If no dimensions provided, create a generic technical diagram
  const dimensionsDisplay = dimensionText.length > 0
    ? dimensionText.join(", ")
    : "Standard product dimensions (show measurement lines and labels)";

  const brandColors = brandKit
    ? `Use brand colors for measurement lines and labels: Primary ${brandKit.primaryColor || "#0066CC"}, Secondary ${brandKit.secondaryColor || "#333333"}.`
    : "";

  const styleDescription = style === "minimal"
    ? "minimalist, clean technical drawing"
    : style === "detailed"
      ? "detailed, comprehensive technical diagram"
      : "professional, clear technical drawing";

  return `Create a professional Amazon product listing dimension diagram for "${project.productName}".

${project.description ? `Product Description: ${project.description}` : ""}

Product Image Reference: ${productImageUrl}
Use this product image as reference for accurate product shape and proportions.

Dimension Requirements:
- ${dimensionsDisplay}
- Size: 1024x1792px tall format
- Style: ${styleDescription}
- Create a technical drawing style diagram showing product measurements
- Include measurement lines with arrows pointing to dimensions
- Add clear dimension labels (e.g., "10 inches", "5 inches")
- Show product outline or silhouette with measurement indicators
- Use a clean, technical drawing aesthetic
- High contrast for readability
- Amazon-compliant design (no watermarks or logos)
${brandColors}
- Professional product specification diagram style
- Easy to read and understand measurements

The diagram should help customers understand the exact size and dimensions of "${project.productName}".`;
}

