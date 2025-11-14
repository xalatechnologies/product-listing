/**
 * Image manipulation utilities
 * 
 * Provides functions for enhancing images:
 * - Lighting adjustment
 * - Sharpness enhancement
 * - Background replacement
 */

import sharp from "sharp";

export interface LightingAdjustmentOptions {
  brightness?: number; // -100 to 100, default 0
  contrast?: number; // -100 to 100, default 0
  exposure?: number; // -100 to 100, default 0
  shadows?: number; // -100 to 100, default 0
  highlights?: number; // -100 to 100, default 0
}

export interface SharpnessOptions {
  amount?: number; // 0 to 100, default 50
  radius?: number; // 0.5 to 2.0, default 1.0
  threshold?: number; // 0 to 10, default 0
}

/**
 * Adjust lighting of an image
 * @param imageBuffer - Input image buffer
 * @param options - Lighting adjustment options
 * @returns Processed image buffer
 */
export async function adjustLighting(
  imageBuffer: Buffer,
  options: LightingAdjustmentOptions,
): Promise<Buffer> {
  const {
    brightness = 0,
    contrast = 0,
    exposure = 0,
    shadows = 0,
    highlights = 0,
  } = options;

  let processed = sharp(imageBuffer);

  // Brightness adjustment (modulate)
  if (brightness !== 0) {
    // Convert brightness (-100 to 100) to modulate brightness (50 to 150)
    const brightnessValue = 100 + brightness;
    processed = processed.modulate({
      brightness: brightnessValue,
    });
  }

  // Contrast adjustment using linear transformation
  if (contrast !== 0) {
    // Convert contrast (-100 to 100) to multiplier (0 to 2)
    const contrastMultiplier = 1 + contrast / 100;
    // Apply linear transformation: output = input * multiplier + offset
    // Offset ensures midpoint (128) stays at 128
    const offset = 128 * (1 - contrastMultiplier);
    processed = processed.linear(contrastMultiplier, offset);
  }

  // Exposure adjustment (gamma)
  if (exposure !== 0) {
    // Convert exposure (-100 to 100) to gamma (0.5 to 2.0)
    const gammaValue = 1 + exposure / 200;
    processed = processed.gamma(gammaValue);
  }

  // Shadows and highlights (simplified using linear adjustments)
  // Note: For more advanced tone mapping, consider using curves or external libraries
  if (shadows !== 0 || highlights !== 0) {
    // Apply a simple linear adjustment for shadows/highlights
    // This is a simplified approach
    if (shadows > 0) {
      // Lift shadows slightly
      const shadowLift = shadows / 500;
      processed = processed.linear(1, shadowLift * 128);
    }
    if (highlights < 0) {
      // Reduce highlights slightly
      const highlightReduction = Math.abs(highlights) / 500;
      processed = processed.linear(1 - highlightReduction, highlightReduction * 128);
    }
  }

  return await processed.toBuffer();
}

/**
 * Enhance image sharpness
 * @param imageBuffer - Input image buffer
 * @param options - Sharpness options
 * @returns Processed image buffer
 */
export async function enhanceSharpness(
  imageBuffer: Buffer,
  options: SharpnessOptions = {},
): Promise<Buffer> {
  const {
    amount = 50,
    radius = 1.0,
    threshold = 0,
  } = options;

  // Use sharp's sharpen function
  // Convert amount (0-100) to sigma (0.3 to 5.0)
  const sigma = 0.3 + (amount / 100) * 4.7;

  // Sharp's sharpen API accepts sigma only, or options object
  // Using sigma only for simplicity
  return await sharp(imageBuffer)
    .sharpen(sigma)
    .toBuffer();
}

/**
 * Remove background from image (wrapper for existing background removal)
 * @param imageUrl - URL of the image
 * @returns Image buffer without background
 */
export async function removeImageBackground(imageUrl: string): Promise<Buffer> {
  const { removeBackground } = await import("./backgroundRemoval");
  const result = await removeBackground(imageUrl);
  return result.imageBuffer;
}

/**
 * Replace background with a new one
 * @param imageBuffer - Image buffer (should have transparent background)
 * @param backgroundBuffer - New background image buffer
 * @param fit - How to fit the image ('contain' | 'cover')
 * @returns Composite image buffer
 */
export async function replaceBackground(
  imageBuffer: Buffer,
  backgroundBuffer: Buffer,
  fit: "contain" | "cover" = "cover",
): Promise<Buffer> {
  const foreground = sharp(imageBuffer);
  const background = sharp(backgroundBuffer);

  const foregroundMeta = await foreground.metadata();
  const backgroundMeta = await background.metadata();

  const bgWidth = backgroundMeta.width || 1000;
  const bgHeight = backgroundMeta.height || 1000;

  // Resize background if needed
  let resizedBg = background.resize(bgWidth, bgHeight, {
    fit: "cover",
  });

  // Resize foreground to fit
  let resizedFg = foreground;
  if (fit === "contain") {
    const fgWidth = foregroundMeta.width || bgWidth;
    const fgHeight = foregroundMeta.height || bgHeight;
    const scale = Math.min(bgWidth / fgWidth, bgHeight / fgHeight);
    resizedFg = foreground.resize(
      Math.round(fgWidth * scale),
      Math.round(fgHeight * scale),
    );
  } else {
    resizedFg = foreground.resize(bgWidth, bgHeight, {
      fit: "contain",
    });
  }

  // Composite foreground over background
  const fgBuffer = await resizedFg.toBuffer();
  const bgBuffer = await resizedBg.toBuffer();

  return await sharp(bgBuffer)
    .composite([
      {
        input: fgBuffer,
        blend: "over",
      },
    ])
    .toBuffer();
}

/**
 * Apply multiple enhancements to an image
 * @param imageBuffer - Input image buffer
 * @param enhancements - Enhancement options
 * @returns Processed image buffer
 */
export async function applyImageEnhancements(
  imageBuffer: Buffer,
  enhancements: {
    lighting?: LightingAdjustmentOptions;
    sharpness?: SharpnessOptions;
    removeBackground?: boolean;
    replaceBackground?: Buffer;
  },
): Promise<Buffer> {
  let processed = imageBuffer;

  // Remove background if requested
  if (enhancements.removeBackground && typeof enhancements.removeBackground === "boolean") {
    // Note: This requires the image to be a URL, so we'd need to handle this differently
    // For now, we'll skip this step if we only have a buffer
    // In production, you might want to upload temporarily or handle differently
  }

  // Apply lighting adjustments
  if (enhancements.lighting) {
    processed = await adjustLighting(processed, enhancements.lighting);
  }

  // Apply sharpness enhancement
  if (enhancements.sharpness) {
    processed = await enhanceSharpness(processed, enhancements.sharpness);
  }

  // Replace background if provided
  if (enhancements.replaceBackground) {
    processed = await replaceBackground(processed, enhancements.replaceBackground);
  }

  return processed;
}

