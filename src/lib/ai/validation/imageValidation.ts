/**
 * Image validation utilities for Amazon compliance
 */

import sharp from "sharp";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  size: number;
}

/**
 * Get image metadata
 */
export async function getImageMetadata(imageBuffer: Buffer): Promise<ImageMetadata> {
  const metadata = await sharp(imageBuffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || "unknown",
    size: imageBuffer.length,
  };
}

/**
 * Check if image dimensions are exactly 1000x1000px
 */
export function checkDimensions(width: number, height: number): boolean {
  return width === 1000 && height === 1000;
}

/**
 * Check if background is white (RGB 255, 255, 255) with tolerance
 * @param imageBuffer - Image buffer
 * @param tolerance - RGB tolerance (default: 5)
 */
export async function checkWhiteBackground(
  imageBuffer: Buffer,
  tolerance: number = 5,
): Promise<boolean> {
  try {
    const image = sharp(imageBuffer);
    const { data, info } = await image
      .resize(100, 100) // Sample corners for performance
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Check corners (top-left, top-right, bottom-left, bottom-right)
    const corners = [
      { x: 0, y: 0 }, // top-left
      { x: info.width - 1, y: 0 }, // top-right
      { x: 0, y: info.height - 1 }, // bottom-left
      { x: info.width - 1, y: info.height - 1 }, // bottom-right
    ];

    for (const corner of corners) {
      const index = (corner.y * info.width + corner.x) * info.channels;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];

      // Check if pixel is white (within tolerance)
      if (
        r < 255 - tolerance ||
        g < 255 - tolerance ||
        b < 255 - tolerance
      ) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error checking background color:", error);
    return false;
  }
}

/**
 * Check if image format is JPEG or PNG
 */
export function checkFormat(format: string): boolean {
  return format === "jpeg" || format === "jpg" || format === "png";
}

/**
 * Check if file size is under 10MB
 */
export function checkFileSize(size: number): boolean {
  const maxSize = 10 * 1024 * 1024; // 10MB
  return size <= maxSize;
}

/**
 * Validate image for Amazon main image compliance
 */
export async function validateAmazonMainImage(
  imageBuffer: Buffer,
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const metadata = await getImageMetadata(imageBuffer);

    // Check dimensions
    if (!checkDimensions(metadata.width, metadata.height)) {
      errors.push(
        `Image dimensions must be exactly 1000x1000px, got ${metadata.width}x${metadata.height}px`,
      );
    }

    // Check format
    if (!checkFormat(metadata.format)) {
      errors.push(`Image format must be JPEG or PNG, got ${metadata.format}`);
    }

    // Check file size
    if (!checkFileSize(metadata.size)) {
      errors.push(
        `File size must be under 10MB, got ${(metadata.size / 1024 / 1024).toFixed(2)}MB`,
      );
    }

    // Check background color (only if dimensions are correct)
    if (checkDimensions(metadata.width, metadata.height)) {
      const isWhite = await checkWhiteBackground(imageBuffer);
      if (!isWhite) {
        warnings.push(
          "Background may not be pure white. Ensure background is RGB(255, 255, 255)",
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : "Unknown error"}`],
      warnings: [],
    };
  }
}

