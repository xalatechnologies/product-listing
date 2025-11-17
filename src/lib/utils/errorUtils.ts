/**
 * Error utility functions for safe error logging and serialization
 * Prevents 431 errors from Next.js error overlay by sanitizing error objects
 */

/**
 * Safely extracts error information without circular references or large objects
 */
export function sanitizeError(error: unknown): {
  message: string;
  stack?: string;
  name?: string;
  cause?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause instanceof Error ? error.cause.message : String(error.cause || ""),
    };
  }

  if (typeof error === "string") {
    return { message: error };
  }

  if (error && typeof error === "object") {
    try {
      const obj = error as Record<string, unknown>;
      return {
        message: obj.message ? String(obj.message) : "Unknown error",
        stack: obj.stack ? String(obj.stack) : undefined,
        name: obj.name ? String(obj.name) : undefined,
      };
    } catch {
      return { message: "Error serialization failed" };
    }
  }

  return { message: "Unknown error occurred" };
}

/**
 * Safely logs an error without including large objects
 */
export function safeLogError(context: string, error: unknown): void {
  const sanitized = sanitizeError(error);
  console.error(`[${context}]`, sanitized.message, {
    name: sanitized.name,
    stack: sanitized.stack?.split("\n").slice(0, 5).join("\n"), // Limit stack trace
    cause: sanitized.cause,
  });
}

/**
 * Safely serializes error for API responses
 */
export function serializeError(error: unknown): { message: string; name?: string } {
  const sanitized = sanitizeError(error);
  return {
    message: sanitized.message,
    name: sanitized.name,
  };
}

