/**
 * Security utilities and validation helpers
 * 
 * This file contains security-related utilities for input sanitization,
 * validation, and security checks.
 */

/**
 * Sanitize string input by trimming and removing potentially dangerous characters
 * Note: React automatically escapes content, but this provides additional safety
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .slice(0, 10000); // Max length limit
}

/**
 * Sanitize HTML content (for display purposes)
 * React automatically escapes content, but this provides additional safety
 */
export function sanitizeHtml(html: string): string {
  // React escapes by default, but we can add additional sanitization if needed
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ""); // Remove event handlers
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    // Only allow https/http protocols
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validate file name to prevent directory traversal and other attacks
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace invalid chars with underscore
    .replace(/\.\./g, "") // Remove parent directory references
    .slice(0, 255); // Max filename length
}

/**
 * Check if string contains potentially dangerous content
 */
export function containsDangerousContent(input: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
    /vbscript:/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Rate limiting configuration per user tier
 */
export const RATE_LIMITS = {
  FREE: {
    requestsPerMinute: 10,
    requestsPerHour: 100,
  },
  STARTER: {
    requestsPerMinute: 30,
    requestsPerHour: 1000,
  },
  PROFESSIONAL: {
    requestsPerMinute: 60,
    requestsPerHour: 5000,
  },
  AGENCY: {
    requestsPerMinute: 200,
    requestsPerHour: 50000,
  },
} as const;

