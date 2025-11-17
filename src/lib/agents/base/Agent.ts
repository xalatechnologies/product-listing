/**
 * Base Agent Interface
 * 
 * All agents implement this interface to ensure consistent behavior
 * across the agent system.
 */

import type { AgentContext } from "./AgentContext";
import type { AgentResult } from "./AgentResult";
import type { ValidationResult } from "./ValidationResult";

/**
 * Base interface that all agents must implement
 */
export interface Agent<TInput = unknown, TOutput = unknown> {
  /** Unique agent name identifier */
  readonly name: string;
  
  /** Agent version for tracking and compatibility */
  readonly version: string;
  
  /** Agent description for documentation */
  readonly description?: string;
  
  /**
   * Main processing method - executes the agent's core functionality
   * @param input - Agent-specific input data
   * @param context - Shared context (userId, projectId, etc.)
   * @returns Promise resolving to agent result
   */
  process(input: TInput, context: AgentContext): Promise<AgentResult<TOutput>>;
  
  /**
   * Validate input before processing
   * @param input - Input to validate
   * @returns Validation result
   */
  validate?(input: TInput): Promise<ValidationResult>;
  
  /**
   * Optional retry logic for failed operations
   * @param input - Original input
   * @param error - Error that occurred
   * @returns Whether to retry
   */
  shouldRetry?(input: TInput, error: Error, attempt: number): Promise<boolean>;
  
  /**
   * Get estimated credits required for this operation
   * @param input - Input data
   * @returns Credits required
   */
  getCreditsRequired?(input: TInput): Promise<number>;
}

/**
 * Base agent class with common functionality
 */
export abstract class BaseAgent<TInput = unknown, TOutput = unknown> implements Agent<TInput, TOutput> {
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly description?: string;
  
  abstract process(input: TInput, context: AgentContext): Promise<AgentResult<TOutput>>;
  
  async validate(input: TInput): Promise<ValidationResult> {
    return { valid: true, errors: [] };
  }
  
  async shouldRetry(input: TInput, error: Error, attempt: number): Promise<boolean> {
    // Default: retry up to 3 times for network errors
    if (attempt >= 3) return false;
    
    const retryableErrors = [
      "ECONNRESET",
      "ETIMEDOUT",
      "ENOTFOUND",
      "network",
      "timeout",
      "rate limit",
    ];
    
    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some((retryable) => errorMessage.includes(retryable));
  }
  
  async getCreditsRequired(input: TInput): Promise<number> {
    return 0; // Default: no credits required
  }
  
  /**
   * Helper to create success result
   */
  protected createSuccessResult(data: TOutput, metadata?: Record<string, unknown>): AgentResult<TOutput> {
    return {
      success: true,
      data,
      metadata: {
        agentName: this.name,
        agentVersion: this.version,
        ...metadata,
      },
    };
  }
  
  /**
   * Helper to create error result
   */
  protected createErrorResult(error: Error, metadata?: Record<string, unknown>): AgentResult<TOutput> {
    return {
      success: false,
      error: {
        code: "AGENT_ERROR",
        message: error.message,
        details: error.stack,
        agentName: this.name,
      },
      metadata: {
        agentName: this.name,
        agentVersion: this.version,
        ...metadata,
      },
    };
  }
}

