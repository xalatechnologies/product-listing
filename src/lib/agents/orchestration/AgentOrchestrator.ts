/**
 * Agent Orchestrator
 * 
 * Orchestrates multiple agents to work together in chains, parallel, or conditional flows.
 */

import type { Agent, AgentContext, AgentResult } from "../base";
import { createAgentError, AgentErrorCodes } from "../base/AgentError";

/**
 * Chain multiple agents together (output of one becomes input of next)
 */
export async function chainAgents<TFirstInput, TLastOutput>(
  agents: Agent[],
  initialInput: TFirstInput,
  context: AgentContext,
  inputTransformers?: Array<(prevOutput: unknown, prevIndex: number) => unknown>,
): Promise<AgentResult<TLastOutput>> {
  let currentInput: unknown = initialInput;
  let lastResult: AgentResult<unknown> | null = null;

  for (let i = 0; i < agents.length; i++) {
    const agent = agents[i]!;
    
    // Transform input if transformer provided
    if (inputTransformers && inputTransformers[i]) {
      currentInput = inputTransformers[i]!(currentInput, i);
    }

    // Process with agent
    const result = await agent.process(currentInput, context);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        metadata: {
          ...result.metadata,
          failedAgent: agent.name,
          agentIndex: i,
        },
      } as AgentResult<TLastOutput>;
    }

    lastResult = result;
    currentInput = result.data;
  }

  return (lastResult as AgentResult<TLastOutput>) || {
    success: false,
    error: createAgentError(new Error("No agents processed"), { code: AgentErrorCodes.PROCESSING_ERROR }),
  };
}

/**
 * Run multiple agents in parallel
 */
export async function runAgentsInParallel<TInput, TOutput>(
  agents: Agent<TInput, TOutput>[],
  input: TInput,
  context: AgentContext,
): Promise<AgentResult<TOutput>[]> {
  const promises = agents.map((agent) => agent.process(input, context));
  return Promise.all(promises);
}

/**
 * Run agents conditionally
 */
export async function runConditionalAgent<TInput, TOutput>(
  condition: boolean,
  agent: Agent<TInput, TOutput>,
  input: TInput,
  context: AgentContext,
): Promise<AgentResult<TOutput | null>> {
  if (!condition) {
    return {
      success: true,
      data: null as TOutput | null,
      metadata: { skipped: true, reason: "Condition not met" },
    };
  }

  return agent.process(input, context);
}

/**
 * Run first successful agent (fallback pattern)
 */
export async function runFirstSuccessful<TInput, TOutput>(
  agents: Agent<TInput, TOutput>[],
  input: TInput,
  context: AgentContext,
): Promise<AgentResult<TOutput>> {
  let lastError: AgentResult<TOutput> | null = null;

  for (const agent of agents) {
    const result = await agent.process(input, context);
    
    if (result.success) {
      return {
        ...result,
        metadata: {
          ...result.metadata,
          fallbackUsed: agents.indexOf(agent) > 0,
        },
      };
    }

    lastError = result;
  }

  return lastError || {
    success: false,
    error: createAgentError(new Error("All agents failed"), { code: AgentErrorCodes.PROCESSING_ERROR }),
  };
}

/**
 * Retry agent with exponential backoff
 */
export async function retryAgent<TInput, TOutput>(
  agent: Agent<TInput, TOutput>,
  input: TInput,
  context: AgentContext,
  maxRetries: number = 3,
  initialDelay: number = 1000,
): Promise<AgentResult<TOutput>> {
  let lastResult: AgentResult<TOutput> | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    lastResult = await agent.process(input, context);

    if (lastResult.success) {
      return {
        ...lastResult,
        metadata: {
          ...lastResult.metadata,
          retries: attempt,
        },
      };
    }

    // Check if should retry
    if (attempt < maxRetries && agent.shouldRetry) {
      const shouldRetry = await agent.shouldRetry(input, new Error(lastResult.error?.message || "Unknown error"), attempt);
      
      if (!shouldRetry) {
        break;
      }

      // Exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    } else {
      break;
    }
  }

  return lastResult || {
    success: false,
    error: createAgentError(new Error("Agent failed after retries"), { code: AgentErrorCodes.PROCESSING_ERROR }),
  };
}

