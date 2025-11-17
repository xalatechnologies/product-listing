/**
 * Agent Result Types
 * 
 * Standardized result types for all agents.
 */

import type { AgentError } from "./AgentError";

/**
 * Result returned by all agents
 */
export interface AgentResult<TOutput = unknown> {
  /** Whether the operation succeeded */
  readonly success: boolean;
  
  /** Output data (if successful) */
  readonly data?: TOutput;
  
  /** Error information (if failed) */
  readonly error?: AgentError;
  
  /** Additional metadata */
  readonly metadata?: {
    /** Agent name that produced this result */
    agentName?: string;
    
    /** Agent version */
    agentVersion?: string;
    
    /** Processing time in milliseconds */
    processingTime?: number;
    
    /** Credits used */
    creditsUsed?: number;
    
    /** Number of retries */
    retries?: number;
    
    /** Additional custom metadata */
    [key: string]: unknown;
  };
}

/**
 * Helper to check if result is successful
 */
export function isSuccessResult<T>(result: AgentResult<T>): result is AgentResult<T> & { success: true; data: T } {
  return result.success === true && result.data !== undefined;
}

/**
 * Helper to check if result is an error
 */
export function isErrorResult<T>(result: AgentResult<T>): result is AgentResult<T> & { success: false; error: AgentError } {
  return result.success === false && result.error !== undefined;
}

/**
 * Extract data from result, throwing if error
 */
export function extractResultData<T>(result: AgentResult<T>): T {
  if (!isSuccessResult(result)) {
    throw new Error(result.error?.message || "Agent operation failed");
  }
  return result.data;
}

