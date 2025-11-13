/**
 * Infographic generator for Amazon product listings
 * 
 * Generates infographics using AI image generation with layout specifications
 */

import { generateImageFromPrompt, downloadGeneratedImage } from "../imageGeneration";
import { uploadGeneratedImage } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { ImageType } from "@prisma/client";
import { extractFeaturesFromProduct, formatFeaturesForInfographic } from "../featureExtraction";
import {
  getTemplate,
  getRandomTemplate,
  applyBrandKitToTemplate,
  type InfographicTemplate,
} from "../templates/infographicTemplates";
import { generateLayoutJSON, applyBrandColors } from "../layoutEngine";

export interface InfographicResult {
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}

/**
 * Generate infographic for Amazon product listing
 */
export async function generateInfographic(
  projectId: string,
  userId: string,
  templateId?: string,
  style?: string,
): Promise<InfographicResult> {
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

  // Step 2: Extract features using GPT-5
  const featureResult = await extractFeaturesFromProduct({
    productName: project.productName,
    description: project.description || undefined,
    category: project.productCategory || undefined,
  });

  const features = formatFeaturesForInfographic(featureResult.features, 6);

  // Step 3: Select template
  const template = templateId
    ? getTemplate(templateId) || getRandomTemplate()
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
  const prompt = createInfographicPrompt(project, features, finalTemplate, layout);

  // Step 7: Generate image using DALL-E 3
  const generatedImages = await generateImageFromPrompt({
    prompt,
    size: "1024x1792", // Tall format for infographics
    quality: "hd",
    style: "vivid",
    n: 1,
  });

  if (!generatedImages || generatedImages.length === 0) {
    throw new Error("Failed to generate infographic image");
  }

  // Step 8: Download and process image
  const imageBuffer = await downloadGeneratedImage(generatedImages[0]!.url);

  // Step 9: Resize to template dimensions if needed
  // (DALL-E 3 generates 1024x1792, we may need to resize to template size)
  // For now, we'll use the generated size

  // Step 10: Upload to Supabase Storage
  const imageUrl = await uploadGeneratedImage(
    userId,
    projectId,
    ImageType.INFOGRAPHIC,
    imageBuffer,
    style,
  );

  // Step 11: Create GeneratedImage record
  const generatedImage = await prisma.generatedImage.create({
    data: {
      projectId,
      type: ImageType.INFOGRAPHIC,
      style: style || template.id,
      url: imageUrl,
      width: finalTemplate.width,
      height: finalTemplate.height,
      size: imageBuffer.length,
      metadata: {
        templateId: template.id,
        templateName: template.name,
        features: features.map((f) => ({ title: f.title, description: f.description })),
        layout: JSON.parse(JSON.stringify(layout)),
        revisedPrompt: generatedImages[0]!.revisedPrompt,
      },
    },
  });

  return {
    url: imageUrl,
    width: finalTemplate.width,
    height: finalTemplate.height,
    size: imageBuffer.length,
    imageId: generatedImage.id,
  };
}

/**
 * Create prompt for infographic generation
 */
function createInfographicPrompt(
  project: {
    productName: string;
    description?: string | null;
  },
  features: Array<{ title: string; description: string }>,
  template: InfographicTemplate,
  layout: any,
): string {
  const featureList = features.map((f) => `- ${f.title}: ${f.description}`).join("\n");

  return `Create a professional Amazon product listing infographic for "${project.productName}".

${project.description ? `Product Description: ${project.description}` : ""}

Key Features to Highlight:
${featureList}

Design Requirements:
- Width: ${template.width}px, Height: ${template.height}px
- Layout Style: ${template.name} - ${template.description}
- Color Scheme: Primary ${template.colorScheme.primary}, Secondary ${template.colorScheme.secondary}, Accent ${template.colorScheme.accent}
- Background: ${template.colorScheme.background}
- Text Color: ${template.colorScheme.text}

Layout Structure:
- Header section at top with product name
- Product image prominently displayed
- Feature list with clear bullet points
- Call-to-action section at bottom

Style: Clean, modern, professional e-commerce design. High contrast for readability. Amazon-compliant design. No watermarks or logos.`;
}

