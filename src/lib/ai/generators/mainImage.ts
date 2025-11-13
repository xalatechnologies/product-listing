/**
 * Main image generator for Amazon product listings
 * 
 * Requirements:
 * - White background (RGB 255, 255, 255)
 * - Exactly 1000x1000px
 * - Product centered
 * - Maintains aspect ratio
 */

import sharp from "sharp";
import { removeBackground } from "../backgroundRemoval";
import { uploadGeneratedImage } from "@/lib/storage";
import { prisma } from "@/lib/db";
import { ImageType } from "@prisma/client";

export interface MainImageResult {
  url: string;
  width: number;
  height: number;
  size: number;
  imageId: string;
}

/**
 * Generate main image for Amazon product listing
 * @param productImageUrl - URL of the product image
 * @param projectId - Project ID
 * @param userId - User ID
 * @returns Generated image URL and metadata
 */
export async function generateMainImage(
  productImageUrl: string,
  projectId: string,
  userId: string,
): Promise<MainImageResult> {
  // Step 1: Remove background from product image
  const { imageBuffer: productWithoutBg } = await removeBackground(productImageUrl);

  // Step 2: Get product image dimensions
  const productImage = sharp(productWithoutBg);
  const productMetadata = await productImage.metadata();
  const productWidth = productMetadata.width || 1000;
  const productHeight = productMetadata.height || 1000;

  // Step 3: Calculate scaling to fit in 1000x1000 while maintaining aspect ratio
  const maxDimension = 900; // Leave some padding from edges
  const scale = Math.min(maxDimension / productWidth, maxDimension / productHeight);
  const scaledWidth = Math.round(productWidth * scale);
  const scaledHeight = Math.round(productHeight * scale);

  // Step 4: Calculate centering position
  const x = Math.round((1000 - scaledWidth) / 2);
  const y = Math.round((1000 - scaledHeight) / 2);

  // Step 5: Create white background 1000x1000px canvas
  const whiteBackground = sharp({
    create: {
      width: 1000,
      height: 1000,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  });

  // Step 6: Composite product image onto white background, centered
  const finalImageBuffer = await whiteBackground
    .composite([
      {
        input: await productImage.resize(scaledWidth, scaledHeight).toBuffer(),
        left: x,
        top: y,
      },
    ])
    .png()
    .toBuffer();

  // Step 7: Upload to Supabase Storage
  const imageUrl = await uploadGeneratedImage(
    userId,
    projectId,
    ImageType.MAIN_IMAGE,
    finalImageBuffer,
  );

  // Step 8: Create GeneratedImage record
  const generatedImage = await prisma.generatedImage.create({
    data: {
      projectId,
      type: ImageType.MAIN_IMAGE,
      url: imageUrl,
      width: 1000,
      height: 1000,
      size: finalImageBuffer.length,
      metadata: {
        sourceImageUrl: productImageUrl,
        productDimensions: {
          width: productWidth,
          height: productHeight,
        },
        scaledDimensions: {
          width: scaledWidth,
          height: scaledHeight,
        },
        position: {
          x,
          y,
        },
      },
    },
  });

  return {
    url: imageUrl,
    width: 1000,
    height: 1000,
    size: finalImageBuffer.length,
    imageId: generatedImage.id,
  };
}

