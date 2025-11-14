import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkDimensions,
  checkFormat,
  checkFileSize,
  getImageMetadata,
  checkWhiteBackground,
  validateAmazonMainImage,
} from '../imageValidation';
import sharp from 'sharp';

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

  describe('getImageMetadata', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should extract image metadata', async () => {
      // Mock sharp metadata
      const mockMetadata = {
        width: 1000,
        height: 1000,
        format: 'jpeg',
      };

      vi.spyOn(sharp.prototype, 'metadata').mockResolvedValue(mockMetadata as any);

      const buffer = Buffer.from('fake-image-data');
      const metadata = await getImageMetadata(buffer);

      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(1000);
      expect(metadata.format).toBe('jpeg');
      expect(metadata.size).toBe(buffer.length);
    });

    it('should handle missing dimensions', async () => {
      const mockMetadata = {
        width: undefined,
        height: undefined,
        format: 'png',
      };

      vi.spyOn(sharp.prototype, 'metadata').mockResolvedValue(mockMetadata as any);

      const buffer = Buffer.from('fake-image-data');
      const metadata = await getImageMetadata(buffer);

      expect(metadata.width).toBe(0);
      expect(metadata.height).toBe(0);
      expect(metadata.format).toBe('png');
    });

    it('should handle unknown format', async () => {
      const mockMetadata = {
        width: 500,
        height: 500,
        format: undefined,
      };

      vi.spyOn(sharp.prototype, 'metadata').mockResolvedValue(mockMetadata as any);

      const buffer = Buffer.from('fake-image-data');
      const metadata = await getImageMetadata(buffer);

      expect(metadata.format).toBe('unknown');
    });
  });

  describe('checkWhiteBackground', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should detect white background', async () => {
      // Mock white background (255, 255, 255) at all corners
      const whitePixelData = Buffer.alloc(100 * 100 * 3, 255); // All white pixels
      
      vi.spyOn(sharp.prototype, 'resize').mockReturnThis();
      vi.spyOn(sharp.prototype, 'raw').mockReturnThis();
      vi.spyOn(sharp.prototype, 'toBuffer').mockResolvedValue({
        data: whitePixelData,
        info: { width: 100, height: 100, channels: 3 },
      } as any);

      const buffer = Buffer.from('fake-image');
      const result = await checkWhiteBackground(buffer);

      expect(result).toBe(true);
    });

    it('should detect non-white background', async () => {
      // Mock non-white background (200, 200, 200) at corners
      const grayPixelData = Buffer.alloc(100 * 100 * 3);
      // Set corners to gray (200, 200, 200)
      for (let i = 0; i < 4; i++) {
        const offset = i * 3;
        grayPixelData[offset] = 200; // R
        grayPixelData[offset + 1] = 200; // G
        grayPixelData[offset + 2] = 200; // B
      }
      
      vi.spyOn(sharp.prototype, 'resize').mockReturnThis();
      vi.spyOn(sharp.prototype, 'raw').mockReturnThis();
      vi.spyOn(sharp.prototype, 'toBuffer').mockResolvedValue({
        data: grayPixelData,
        info: { width: 100, height: 100, channels: 3 },
      } as any);

      const buffer = Buffer.from('fake-image');
      const result = await checkWhiteBackground(buffer, 5);

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      vi.spyOn(sharp.prototype, 'resize').mockImplementation(() => {
        throw new Error('Processing error');
      });

      const buffer = Buffer.from('fake-image');
      const result = await checkWhiteBackground(buffer);

      expect(result).toBe(false);
    });
  });

  describe('validateAmazonMainImage', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should validate compliant image', async () => {
      const mockMetadata = {
        width: 1000,
        height: 1000,
        format: 'jpeg',
      };

      const whitePixelData = Buffer.alloc(100 * 100 * 3, 255);

      vi.spyOn(sharp.prototype, 'metadata').mockResolvedValue(mockMetadata as any);
      vi.spyOn(sharp.prototype, 'resize').mockReturnThis();
      vi.spyOn(sharp.prototype, 'raw').mockReturnThis();
      vi.spyOn(sharp.prototype, 'toBuffer').mockResolvedValue({
        data: whitePixelData,
        info: { width: 100, height: 100, channels: 3 },
      } as any);

      const buffer = Buffer.alloc(5 * 1024 * 1024); // 5MB
      const result = await validateAmazonMainImage(buffer);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject incorrect dimensions', async () => {
      const mockMetadata = {
        width: 800,
        height: 800,
        format: 'jpeg',
      };

      vi.spyOn(sharp.prototype, 'metadata').mockResolvedValue(mockMetadata as any);

      const buffer = Buffer.alloc(5 * 1024 * 1024);
      const result = await validateAmazonMainImage(buffer);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('dimensions'))).toBe(true);
    });

    it('should reject invalid format', async () => {
      const mockMetadata = {
        width: 1000,
        height: 1000,
        format: 'gif',
      };

      vi.spyOn(sharp.prototype, 'metadata').mockResolvedValue(mockMetadata as any);

      const buffer = Buffer.alloc(5 * 1024 * 1024);
      const result = await validateAmazonMainImage(buffer);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('format'))).toBe(true);
    });

    it('should reject oversized files', async () => {
      const mockMetadata = {
        width: 1000,
        height: 1000,
        format: 'jpeg',
      };

      vi.spyOn(sharp.prototype, 'metadata').mockResolvedValue(mockMetadata as any);

      const buffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const result = await validateAmazonMainImage(buffer);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('size'))).toBe(true);
    });

    it('should warn about non-white background', async () => {
      const mockMetadata = {
        width: 1000,
        height: 1000,
        format: 'jpeg',
      };

      const grayPixelData = Buffer.alloc(100 * 100 * 3);
      grayPixelData.fill(200); // Gray background

      vi.spyOn(sharp.prototype, 'metadata').mockResolvedValue(mockMetadata as any);
      vi.spyOn(sharp.prototype, 'resize').mockReturnThis();
      vi.spyOn(sharp.prototype, 'raw').mockReturnThis();
      vi.spyOn(sharp.prototype, 'toBuffer').mockResolvedValue({
        data: grayPixelData,
        info: { width: 100, height: 100, channels: 3 },
      } as any);

      const buffer = Buffer.alloc(5 * 1024 * 1024);
      const result = await validateAmazonMainImage(buffer);

      expect(result.valid).toBe(true); // Still valid, just a warning
      expect(result.warnings.some(w => w.includes('white'))).toBe(true);
    });

    it('should handle processing errors', async () => {
      vi.spyOn(sharp.prototype, 'metadata').mockRejectedValue(new Error('Processing failed'));

      const buffer = Buffer.from('invalid-image');
      const result = await validateAmazonMainImage(buffer);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('error'))).toBe(true);
    });
  });
});

