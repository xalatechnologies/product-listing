/**
 * Tests for Agent Orchestration
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  chainAgents,
  runAgentsInParallel,
  runConditionalAgent,
  runFirstSuccessful,
  retryAgent,
} from "../orchestration/AgentOrchestrator";
import { BaseAgent, createAgentContext, type AgentContext, type AgentResult } from "../base";
import { createAgentError, AgentErrorCodes } from "../base/AgentError";

// Test agents
class SuccessAgent extends BaseAgent<{ value: number }, { doubled: number }> {
  readonly name = "success-agent";
  readonly version = "1.0.0";

  async process(input: { value: number }, context: AgentContext): Promise<AgentResult<{ doubled: number }>> {
    return this.createSuccessResult({ doubled: input.value * 2 });
  }
}

class FailAgent extends BaseAgent<{ value: number }, { doubled: number }> {
  readonly name = "fail-agent";
  readonly version = "1.0.0";

  async process(input: { value: number }, context: AgentContext): Promise<AgentResult<{ doubled: number }>> {
    return this.createErrorResult(new Error("Always fails"));
  }
}

class RetryableAgent extends BaseAgent<{ value: number }, { doubled: number }> {
  readonly name = "retryable-agent";
  readonly version = "1.0.0";
  private attemptCount = 0;

  async process(input: { value: number }, context: AgentContext): Promise<AgentResult<{ doubled: number }>> {
    this.attemptCount++;
    if (this.attemptCount < 2) {
      return this.createErrorResult(new Error("Network error"));
    }
    return this.createSuccessResult({ doubled: input.value * 2 });
  }

  async shouldRetry(input: { value: number }, error: Error, attempt: number): Promise<boolean> {
    return attempt < 2 && error.message.includes("Network");
  }
}

describe("Agent Orchestration", () => {
  let context: ReturnType<typeof createAgentContext>;

  beforeEach(() => {
    context = createAgentContext({ userId: "user-123" });
  });

  describe("chainAgents", () => {
    it("should chain agents successfully", async () => {
      const agent1 = new SuccessAgent();
      const agent2 = new SuccessAgent();

      // Transform output of first agent to input of second
      const transformers = [
        undefined,
        (prevOutput: { doubled: number }) => ({ value: prevOutput.doubled }),
      ];

      const result = await chainAgents([agent1, agent2], { value: 5 }, context, transformers);

      expect(result.success).toBe(true);
      expect(result.data?.doubled).toBe(20); // 5 * 2 * 2
    });

    it("should stop on first failure", async () => {
      const agent1 = new SuccessAgent();
      const agent2 = new FailAgent();

      const result = await chainAgents([agent1, agent2], { value: 5 }, context);

      expect(result.success).toBe(false);
      expect(result.metadata?.failedAgent).toBe("fail-agent");
    });

    it("should transform input between agents", async () => {
      const agent1 = new SuccessAgent();
      const agent2 = new SuccessAgent();

      const transformers = [
        undefined,
        (prevOutput: { doubled: number }) => ({ value: prevOutput.doubled }),
      ];

      const result = await chainAgents([agent1, agent2], { value: 5 }, context, transformers);

      expect(result.success).toBe(true);
    });
  });

  describe("runAgentsInParallel", () => {
    it("should run agents in parallel", async () => {
      const agent1 = new SuccessAgent();
      const agent2 = new SuccessAgent();

      const results = await runAgentsInParallel([agent1, agent2], { value: 5 }, context);

      expect(results).toHaveLength(2);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(true);
    });

    it("should handle mixed results", async () => {
      const agent1 = new SuccessAgent();
      const agent2 = new FailAgent();

      const results = await runAgentsInParallel([agent1, agent2], { value: 5 }, context);

      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(false);
    });
  });

  describe("runConditionalAgent", () => {
    it("should run agent when condition is true", async () => {
      const agent = new SuccessAgent();

      const result = await runConditionalAgent(true, agent, { value: 5 }, context);

      expect(result.success).toBe(true);
      expect(result.data?.doubled).toBe(10);
    });

    it("should skip agent when condition is false", async () => {
      const agent = new SuccessAgent();

      const result = await runConditionalAgent(false, agent, { value: 5 }, context);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.metadata?.skipped).toBe(true);
    });
  });

  describe("runFirstSuccessful", () => {
    it("should return first successful result", async () => {
      const agent1 = new FailAgent();
      const agent2 = new SuccessAgent();
      const agent3 = new SuccessAgent();

      const result = await runFirstSuccessful([agent1, agent2, agent3], { value: 5 }, context);

      expect(result.success).toBe(true);
      expect(result.data?.doubled).toBe(10);
      expect(result.metadata?.fallbackUsed).toBe(true);
    });

    it("should return error if all agents fail", async () => {
      const agent1 = new FailAgent();
      const agent2 = new FailAgent();

      const result = await runFirstSuccessful([agent1, agent2], { value: 5 }, context);

      expect(result.success).toBe(false);
    });
  });

  describe("retryAgent", () => {
    it("should retry on failure and succeed", async () => {
      const agent = new RetryableAgent();

      const result = await retryAgent(agent, { value: 5 }, context, 3, 10);

      expect(result.success).toBe(true);
      expect(result.data?.doubled).toBe(10);
      expect(result.metadata?.retries).toBe(1);
    });

    it("should stop retrying after max attempts", async () => {
      const agent = new FailAgent();

      const result = await retryAgent(agent, { value: 5 }, context, 2, 10);

      expect(result.success).toBe(false);
    });
  });
});

