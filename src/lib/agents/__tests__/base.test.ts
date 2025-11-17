/**
 * Tests for base agent infrastructure
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BaseAgent, createAgentContext, type AgentContext, type AgentResult } from "../base";
import { createAgentError, AgentErrorCodes } from "../base/AgentError";
import { createValidResult, createInvalidResult, createValidationError } from "../base/ValidationResult";
import { isSuccessResult, isErrorResult, extractResultData } from "../base/AgentResult";

// Test agent implementation
class TestAgent extends BaseAgent<{ value: number }, { doubled: number }> {
  readonly name = "test-agent";
  readonly version = "1.0.0";
  readonly description = "Test agent for unit testing";

  async process(
    input: { value: number },
    context: AgentContext,
  ): Promise<AgentResult<{ doubled: number }>> {
    if (input.value < 0) {
      return this.createErrorResult(new Error("Value must be positive"));
    }
    return this.createSuccessResult({ doubled: input.value * 2 });
  }
}

describe("Base Agent Infrastructure", () => {
  describe("AgentContext", () => {
    it("should create agent context with required fields", () => {
      const context = createAgentContext({
        userId: "user-123",
        projectId: "project-456",
        jobId: "job-789",
        metadata: { test: "data" },
      });

      expect(context.userId).toBe("user-123");
      expect(context.projectId).toBe("project-456");
      expect(context.jobId).toBe("job-789");
      expect(context.metadata?.test).toBe("data");
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it("should create context with minimal fields", () => {
      const context = createAgentContext({
        userId: "user-123",
      });

      expect(context.userId).toBe("user-123");
      expect(context.projectId).toBeUndefined();
      expect(context.jobId).toBeUndefined();
    });
  });

  describe("AgentResult", () => {
    it("should identify success results", () => {
      const successResult: AgentResult<{ value: number }> = {
        success: true,
        data: { value: 42 },
      };

      expect(isSuccessResult(successResult)).toBe(true);
      expect(isErrorResult(successResult)).toBe(false);
    });

    it("should identify error results", () => {
      const errorResult: AgentResult<{ value: number }> = {
        success: false,
        error: createAgentError(new Error("Test error")),
      };

      expect(isErrorResult(errorResult)).toBe(true);
      expect(isSuccessResult(errorResult)).toBe(false);
    });

    it("should extract data from success result", () => {
      const result: AgentResult<{ value: number }> = {
        success: true,
        data: { value: 42 },
      };

      const data = extractResultData(result);
      expect(data.value).toBe(42);
    });

    it("should throw when extracting data from error result", () => {
      const result: AgentResult<{ value: number }> = {
        success: false,
        error: createAgentError(new Error("Test error")),
      };

      expect(() => extractResultData(result)).toThrow();
    });
  });

  describe("AgentError", () => {
    it("should create agent error from Error object", () => {
      const error = new Error("Test error");
      const agentError = createAgentError(error, {
        code: AgentErrorCodes.PROCESSING_ERROR,
        agentName: "test-agent",
        retryable: true,
      });

      expect(agentError.code).toBe(AgentErrorCodes.PROCESSING_ERROR);
      expect(agentError.message).toBe("Test error");
      expect(agentError.agentName).toBe("test-agent");
      expect(agentError.retryable).toBe(true);
      expect(agentError.originalError).toBe(error);
    });

    it("should create agent error from string", () => {
      const agentError = createAgentError("String error", {
        code: AgentErrorCodes.VALIDATION_ERROR,
      });

      expect(agentError.message).toBe("String error");
      expect(agentError.code).toBe(AgentErrorCodes.VALIDATION_ERROR);
    });
  });

  describe("ValidationResult", () => {
    it("should create valid result", () => {
      const result = createValidResult();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should create invalid result with errors", () => {
      const errors = [
        createValidationError("Field required", "field1"),
        createValidationError("Invalid format", "field2", "INVALID"),
      ];
      const result = createInvalidResult(errors);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]?.field).toBe("field1");
      expect(result.errors[1]?.code).toBe("INVALID");
    });
  });

  describe("BaseAgent", () => {
    let agent: TestAgent;

    beforeEach(() => {
      agent = new TestAgent();
    });

    it("should have correct properties", () => {
      expect(agent.name).toBe("test-agent");
      expect(agent.version).toBe("1.0.0");
      expect(agent.description).toBe("Test agent for unit testing");
    });

    it("should process input successfully", async () => {
      const context = createAgentContext({ userId: "user-123" });
      const result = await agent.process({ value: 5 }, context);

      expect(result.success).toBe(true);
      expect(result.data?.doubled).toBe(10);
    });

    it("should handle errors", async () => {
      const context = createAgentContext({ userId: "user-123" });
      const result = await agent.process({ value: -1 }, context);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("positive");
    });

    it("should provide default validation", async () => {
      const result = await agent.validate({ value: 5 });
      expect(result.valid).toBe(true);
    });

    it("should determine retryability for network errors", async () => {
      const networkError = new Error("Network timeout");
      const shouldRetry = await agent.shouldRetry({ value: 5 }, networkError, 0);

      expect(shouldRetry).toBe(true);
    });

    it("should not retry after max attempts", async () => {
      const networkError = new Error("Network timeout");
      const shouldRetry = await agent.shouldRetry({ value: 5 }, networkError, 3);

      expect(shouldRetry).toBe(false);
    });

    it("should not retry non-retryable errors", async () => {
      const validationError = new Error("Invalid input");
      const shouldRetry = await agent.shouldRetry({ value: 5 }, validationError, 0);

      expect(shouldRetry).toBe(false);
    });

    it("should return default credits required", async () => {
      const credits = await agent.getCreditsRequired({ value: 5 });
      expect(credits).toBe(0);
    });
  });
});

