/**
 * Agent Error Types
 * 
 * Standardized error types for agent operations.
 */

/**
 * Agent-specific error
 */
export interface AgentError {
  /** Error code for programmatic handling */
  readonly code: string;
  
  /** Human-readable error message */
  readonly message: string;
  
  /** Additional error details */
  readonly details?: string;
  
  /** Agent that produced this error */
  readonly agentName?: string;
  
  /** Whether this error is retryable */
  readonly retryable?: boolean;
  
  /** HTTP status code (if applicable) */
  readonly statusCode?: number;
  
  /** Original error (if wrapped) */
  readonly originalError?: Error;
}

/**
 * Create agent error from various error types
 */
export function createAgentError(
  error: Error | string,
  options?: {
    code?: string;
    agentName?: string;
    retryable?: boolean;
    statusCode?: number;
  },
): AgentError {
  const message = typeof error === "string" ? error : error.message;
  const details = typeof error === "string" ? undefined : error.stack;
  
  return {
    code: options?.code || "AGENT_ERROR",
    message,
    details,
    agentName: options?.agentName,
    retryable: options?.retryable ?? false,
    statusCode: options?.statusCode,
    originalError: typeof error === "string" ? undefined : error,
  };
}

/**
 * Common error codes
 */
export const AgentErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  PROCESSING_ERROR: "PROCESSING_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  RATE_LIMIT_ERROR: "RATE_LIMIT_ERROR",
  INSUFFICIENT_CREDITS: "INSUFFICIENT_CREDITS",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
} as const;

