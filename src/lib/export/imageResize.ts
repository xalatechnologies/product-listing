/**
 * Image Resize Service
 * 
 * Utilities for resizing and converting images for marketplace exports
 */

import sharp from "sharp";
import { MarketplaceSpec } from "./specs";

export interface ResizeOptions {
  width: number;
  height: number;
  format?: "jpeg" | "png" | "webp";
  quality?: number; // 1-100
  fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  background?: { r: number; g: number; b: number; alpha?: number };
}

/**
 * Resize image to specific dimensions
 */
export async function resizeImage(
  inputBuffer: Buffer,
  options: ResizeOptions,
): Promise<Buffer> {
  const {
    width,
    height,
    format = "jpeg",
    quality = 90,
    fit = "contain",
    background = { r: 255, g: 255, b: 255 },
  } = options;

  let sharpInstance = sharp(inputBuffer).resize(width, height, {
    fit,
    background: {
      r: background.r,
      g: background.g,
      b: background.b,
      alpha: background.alpha ?? 1,
    },
  });

  // Convert format
  switch (format) {
    case "jpeg":
      sharpInstance = sharpInstance.jpeg({ quality });
      break;
    case "png":
      sharpInstance = sharpInstance.png({ quality });
      break;
    case "webp":
      sharpInstance = sharpInstance.webp({ quality });
      break;
  }

  return await sharpInstance.toBuffer();
}

/**
 * Resize image according to marketplace specification
 */
export async function resizeForMarketplace(
  inputBuffer: Buffer,
  spec: MarketplaceSpec,
  isMainImage: boolean = false,
): Promise<Buffer> {
  const imageSpec = isMainImage ? spec.mainImage : spec.additionalImages;

  // Convert format string to sharp format
  const formatMap: Record<string, "jpeg" | "png" | "webp"> = {
    JPEG: "jpeg",
    PNG: "png",
    WebP: "webp",
  };

  const format = formatMap[imageSpec.format] || "jpeg";

  // For Amazon main image, use fill to ensure exact dimensions
  const fit = isMainImage && spec.name === "Amazon" ? "fill" : "contain";

  // White background for Amazon main image
  const background =
    isMainImage && spec.name === "Amazon"
      ? { r: 255, g: 255, b: 255 }
      : { r: 255, g: 255, b: 255 };

  return await resizeImage(inputBuffer, {
    width: imageSpec.width,
    height: imageSpec.height,
    format,
    quality: 90,
    fit,
    background,
  });
}

/**
 * Download image from URL and return buffer
 */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Optimize image quality while maintaining size constraints
 */
export async function optimizeImage(
  inputBuffer: Buffer,
  maxSizeMB: number,
  format: "jpeg" | "png" | "webp" = "jpeg",
): Promise<Buffer> {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  let quality = 90;
  let outputBuffer = await sharp(inputBuffer).toFormat(format, { quality }).toBuffer();

  // Reduce quality until under size limit
  while (outputBuffer.length > maxSizeBytes && quality > 20) {
    quality -= 10;
    outputBuffer = await sharp(inputBuffer).toFormat(format, { quality }).toBuffer();
  }

  if (outputBuffer.length > maxSizeBytes) {
    throw new Error(`Image cannot be optimized to under ${maxSizeMB}MB`);
  }

  return outputBuffer;
}

