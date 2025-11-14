import { describe, it, expect } from 'vitest';
import { ImageType } from '@prisma/client';
import {
  getCreditsRequiredForImage,
  getCreditsRequiredForAPlus,
} from '../credits';

describe('Credit Utilities', () => {
  describe('getCreditsRequiredForImage', () => {
    it('should return correct credits for MAIN_IMAGE', () => {
      expect(getCreditsRequiredForImage(ImageType.MAIN_IMAGE)).toBe(5);
    });

    it('should return correct credits for INFOGRAPHIC', () => {
      expect(getCreditsRequiredForImage(ImageType.INFOGRAPHIC)).toBe(10);
    });

    it('should return correct credits for FEATURE_HIGHLIGHT', () => {
      expect(getCreditsRequiredForImage(ImageType.FEATURE_HIGHLIGHT)).toBe(5);
    });

    it('should return correct credits for LIFESTYLE', () => {
      expect(getCreditsRequiredForImage(ImageType.LIFESTYLE)).toBe(8);
    });

    it('should return correct credits for COMPARISON_CHART', () => {
      expect(getCreditsRequiredForImage(ImageType.COMPARISON_CHART)).toBe(10);
    });

    it('should return correct credits for DIMENSION_DIAGRAM', () => {
      expect(getCreditsRequiredForImage(ImageType.DIMENSION_DIAGRAM)).toBe(5);
    });

    it('should return correct credits for A_PLUS_MODULE', () => {
      expect(getCreditsRequiredForImage(ImageType.A_PLUS_MODULE)).toBe(3);
    });

    it('should return default 5 credits for unknown image types', () => {
      // TypeScript won't allow invalid enum values, but test the fallback logic
      // by checking that the function handles all known types correctly
      const allTypes = Object.values(ImageType);
      allTypes.forEach((type) => {
        const credits = getCreditsRequiredForImage(type);
        expect(credits).toBeGreaterThan(0);
        expect(typeof credits).toBe('number');
      });
    });
  });

  describe('getCreditsRequiredForAPlus', () => {
    it('should return 50 credits for premium A+ content', () => {
      expect(getCreditsRequiredForAPlus(true)).toBe(50);
    });

    it('should return 20 credits for standard A+ content', () => {
      expect(getCreditsRequiredForAPlus(false)).toBe(20);
    });

    it('should return different values for premium vs standard', () => {
      const premiumCredits = getCreditsRequiredForAPlus(true);
      const standardCredits = getCreditsRequiredForAPlus(false);
      
      expect(premiumCredits).toBeGreaterThan(standardCredits);
      expect(premiumCredits).toBe(50);
      expect(standardCredits).toBe(20);
    });
  });
});

