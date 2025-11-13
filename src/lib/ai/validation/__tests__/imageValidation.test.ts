import { describe, it, expect } from 'vitest';
import {
  checkDimensions,
  checkFormat,
  checkFileSize,
} from '../imageValidation';

describe('Image Validation', () => {
  describe('checkDimensions', () => {
    it('should accept 1000x1000 dimensions', () => {
      expect(checkDimensions(1000, 1000)).toBe(true);
    });

    it('should reject non-square dimensions', () => {
      expect(checkDimensions(1000, 800)).toBe(false);
      expect(checkDimensions(800, 1000)).toBe(false);
    });

    it('should reject incorrect size', () => {
      expect(checkDimensions(500, 500)).toBe(false);
      expect(checkDimensions(2000, 2000)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(checkDimensions(0, 0)).toBe(false);
      expect(checkDimensions(-1, -1)).toBe(false);
    });
  });

  describe('checkFormat', () => {
    it('should accept JPEG format', () => {
      expect(checkFormat('jpeg')).toBe(true);
      expect(checkFormat('jpg')).toBe(true);
    });

    it('should accept PNG format', () => {
      expect(checkFormat('png')).toBe(true);
    });

    it('should reject other formats', () => {
      expect(checkFormat('gif')).toBe(false);
      expect(checkFormat('webp')).toBe(false);
      expect(checkFormat('svg')).toBe(false);
    });

    it('should be case sensitive (lowercase only)', () => {
      // The function is case sensitive, only accepts lowercase
      expect(checkFormat('JPEG')).toBe(false);
      expect(checkFormat('PNG')).toBe(false);
      expect(checkFormat('jpeg')).toBe(true);
      expect(checkFormat('png')).toBe(true);
    });
  });

  describe('checkFileSize', () => {
    it('should accept files under 10MB', () => {
      const size10MB = 10 * 1024 * 1024;
      expect(checkFileSize(size10MB)).toBe(true);
      expect(checkFileSize(size10MB - 1)).toBe(true);
      expect(checkFileSize(1024)).toBe(true);
    });

    it('should reject files over 10MB', () => {
      const size10MB = 10 * 1024 * 1024;
      expect(checkFileSize(size10MB + 1)).toBe(false);
      expect(checkFileSize(20 * 1024 * 1024)).toBe(false);
    });

    it('should handle zero size', () => {
      expect(checkFileSize(0)).toBe(true);
    });
  });
});

