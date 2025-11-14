/**
 * Credit cost utilities
 * Defines credit costs for different operations
 */

import { ImageType } from "@prisma/client";

/**
 * Get credits required for generating an image type
 */
export function getCreditsRequiredForImage(type: ImageType): number {
  const creditsMap: Record<ImageType, number> = {
    MAIN_IMAGE: 5,
    INFOGRAPHIC: 10,
    FEATURE_HIGHLIGHT: 5,
    LIFESTYLE: 8,
    COMPARISON_CHART: 10,
    DIMENSION_DIAGRAM: 5,
    A_PLUS_MODULE: 3,
  };

  return creditsMap[type] || 5;
}

/**
 * Get credits required for A+ content generation
 */
export function getCreditsRequiredForAPlus(isPremium: boolean): number {
  return isPremium ? 50 : 20;
}

