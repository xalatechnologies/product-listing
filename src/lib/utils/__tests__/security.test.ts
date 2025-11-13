import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeHtml,
  sanitizeUrl,
  sanitizeFileName,
  containsDangerousContent,
  RATE_LIMITS,
} from '../security';

describe('Security Utilities', () => {
  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should remove angle brackets', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should limit length to 10000 characters', () => {
      const longString = 'a'.repeat(20000);
      expect(sanitizeString(longString).length).toBe(10000);
    });

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('should handle strings with only whitespace', () => {
      expect(sanitizeString('   ')).toBe('');
    });
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const html = '<div>Hello</div><script>alert("xss")</script><p>World</p>';
      expect(sanitizeHtml(html)).not.toContain('<script>');
      expect(sanitizeHtml(html)).toContain('<div>Hello</div>');
    });

    it('should remove javascript: protocol', () => {
      const html = '<a href="javascript:alert(1)">Click</a>';
      expect(sanitizeHtml(html)).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const html = '<div onclick="alert(1)">Click</div>';
      expect(sanitizeHtml(html)).not.toContain('onclick=');
    });

    it('should handle empty strings', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should preserve safe HTML', () => {
      const html = '<div>Hello <strong>World</strong></div>';
      expect(sanitizeHtml(html)).toContain('Hello');
      expect(sanitizeHtml(html)).toContain('World');
    });
  });

  describe('sanitizeUrl', () => {
    it('should accept valid http URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
    });

    it('should accept valid https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
    });

    it('should reject javascript: protocol', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    });

    it('should reject data: protocol', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('should reject invalid URLs', () => {
      expect(sanitizeUrl('not-a-url')).toBeNull();
    });

    it('should handle URLs with paths and query strings', () => {
      const url = 'https://example.com/path?query=value';
      expect(sanitizeUrl(url)).toBe('https://example.com/path?query=value');
    });
  });

  describe('sanitizeFileName', () => {
    it('should replace invalid characters with underscores', () => {
      expect(sanitizeFileName('file name@123.txt')).toBe('file_name_123.txt');
    });

    it('should remove parent directory references', () => {
      // The function replaces .. with empty string, then replaces / with _
      expect(sanitizeFileName('../../../etc/passwd')).toBe('___etc_passwd');
      expect(sanitizeFileName('../file.txt')).toBe('_file.txt');
      expect(sanitizeFileName('../../file.txt')).toBe('__file.txt');
    });

    it('should limit length to 255 characters', () => {
      const longName = 'a'.repeat(300) + '.txt';
      expect(sanitizeFileName(longName).length).toBe(255);
    });

    it('should preserve valid characters', () => {
      expect(sanitizeFileName('my-file_123.png')).toBe('my-file_123.png');
    });

    it('should handle empty strings', () => {
      expect(sanitizeFileName('')).toBe('');
    });

    it('should handle special characters', () => {
      expect(sanitizeFileName('file<>:"|?*.txt')).toBe('file_______.txt');
    });
  });

  describe('containsDangerousContent', () => {
    it('should detect script tags', () => {
      expect(containsDangerousContent('<script>alert(1)</script>')).toBe(true);
      expect(containsDangerousContent('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      expect(containsDangerousContent('javascript:alert(1)')).toBe(true);
      expect(containsDangerousContent('JAVASCRIPT:alert(1)')).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(containsDangerousContent('<div onclick="alert(1)">')).toBe(true);
      expect(containsDangerousContent('<div onerror="alert(1)">')).toBe(true);
    });

    it('should detect data:text/html', () => {
      expect(containsDangerousContent('data:text/html,<script>alert(1)</script>')).toBe(true);
    });

    it('should detect vbscript:', () => {
      expect(containsDangerousContent('vbscript:alert(1)')).toBe(true);
    });

    it('should return false for safe content', () => {
      expect(containsDangerousContent('Hello World')).toBe(false);
      expect(containsDangerousContent('<div>Safe HTML</div>')).toBe(false);
      expect(containsDangerousContent('https://example.com')).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(containsDangerousContent('')).toBe(false);
    });
  });

  describe('RATE_LIMITS', () => {
    it('should have rate limits for all tiers', () => {
      expect(RATE_LIMITS.FREE).toBeDefined();
      expect(RATE_LIMITS.STARTER).toBeDefined();
      expect(RATE_LIMITS.PROFESSIONAL).toBeDefined();
      expect(RATE_LIMITS.AGENCY).toBeDefined();
    });

    it('should have increasing limits for higher tiers', () => {
      expect(RATE_LIMITS.AGENCY.requestsPerMinute).toBeGreaterThan(
        RATE_LIMITS.PROFESSIONAL.requestsPerMinute
      );
      expect(RATE_LIMITS.PROFESSIONAL.requestsPerMinute).toBeGreaterThan(
        RATE_LIMITS.STARTER.requestsPerMinute
      );
      expect(RATE_LIMITS.STARTER.requestsPerMinute).toBeGreaterThan(
        RATE_LIMITS.FREE.requestsPerMinute
      );
    });

    it('should have valid numeric values', () => {
      Object.values(RATE_LIMITS).forEach((tier) => {
        expect(tier.requestsPerMinute).toBeGreaterThan(0);
        expect(tier.requestsPerHour).toBeGreaterThan(0);
        expect(Number.isInteger(tier.requestsPerMinute)).toBe(true);
        expect(Number.isInteger(tier.requestsPerHour)).toBe(true);
      });
    });
  });
});

