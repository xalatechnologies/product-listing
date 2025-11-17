/**
 * Tests for Agent Monitoring
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { logAgentExecution, agentPerformanceTracker, getAgentMetrics } from "../monitoring/AgentMetrics";
import { createAgentContext } from "../base";
import { createAgentError, AgentErrorCodes } from "../base/AgentError";

describe("Agent Monitoring", () => {
  beforeEach(() => {
    agentPerformanceTracker.reset();
    vi.clearAllMocks();
  });

  describe("logAgentExecution", () => {
    it("should log successful execution", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const result = {
        success: true,
        data: { value: 42 },
        metadata: { processingTime: 100, creditsUsed: 5 },
      };

      await logAgentExecution(
        "test-agent",
        "1.0.0",
        result,
        { userId: "user-123", projectId: "project-456" },
      );

      expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0]![0];
      expect(logCall).toContain("Agent Execution");
    });

    it("should log failed execution", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const result = {
        success: false,
        error: createAgentError(new Error("Test error"), { code: AgentErrorCodes.PROCESSING_ERROR }),
        metadata: { processingTime: 50 },
      };

      await logAgentExecution(
        "test-agent",
        "1.0.0",
        result,
        { userId: "user-123" },
      );

      expect(consoleSpy).toHaveBeenCalled();
    });

    it("should not throw on logging errors", async () => {
      vi.spyOn(console, "log").mockImplementation(() => {
        throw new Error("Logging failed");
      });

      const result = {
        success: true,
        data: { value: 42 },
      };

      await expect(
        logAgentExecution("test-agent", "1.0.0", result, { userId: "user-123" }),
      ).resolves.not.toThrow();
    });
  });

  describe("agentPerformanceTracker", () => {
    it("should track successful executions", () => {
      const result = {
        success: true,
        data: { value: 42 },
        metadata: { processingTime: 100, creditsUsed: 5 },
      };

      agentPerformanceTracker.recordExecution("test-agent", result);

      const metrics = agentPerformanceTracker.getMetrics("test-agent");
      expect(metrics).not.toBeNull();
      expect(metrics?.totalExecutions).toBe(1);
      expect(metrics?.successfulExecutions).toBe(1);
      expect(metrics?.failedExecutions).toBe(0);
      expect(metrics?.averageProcessingTime).toBe(100);
      expect(metrics?.totalCreditsUsed).toBe(5);
      expect(metrics?.successRate).toBe(1);
    });

    it("should track failed executions", () => {
      const result = {
        success: false,
        error: createAgentError(new Error("Test error")),
        metadata: { processingTime: 50 },
      };

      agentPerformanceTracker.recordExecution("test-agent", result);

      const metrics = agentPerformanceTracker.getMetrics("test-agent");
      expect(metrics?.totalExecutions).toBe(1);
      expect(metrics?.successfulExecutions).toBe(0);
      expect(metrics?.failedExecutions).toBe(1);
      expect(metrics?.successRate).toBe(0);
    });

    it("should calculate average processing time", () => {
      agentPerformanceTracker.recordExecution("test-agent", {
        success: true,
        data: {},
        metadata: { processingTime: 100 },
      });

      agentPerformanceTracker.recordExecution("test-agent", {
        success: true,
        data: {},
        metadata: { processingTime: 200 },
      });

      const metrics = agentPerformanceTracker.getMetrics("test-agent");
      expect(metrics?.averageProcessingTime).toBe(150);
    });

    it("should calculate success rate", () => {
      agentPerformanceTracker.recordExecution("test-agent", {
        success: true,
        data: {},
      });

      agentPerformanceTracker.recordExecution("test-agent", {
        success: true,
        data: {},
      });

      agentPerformanceTracker.recordExecution("test-agent", {
        success: false,
        error: createAgentError(new Error("Error")),
      });

      const metrics = agentPerformanceTracker.getMetrics("test-agent");
      expect(metrics?.successRate).toBeCloseTo(0.666, 2);
    });

    it("should return null for unknown agent", () => {
      const metrics = agentPerformanceTracker.getMetrics("unknown-agent");
      expect(metrics).toBeNull();
    });

    it("should get all metrics", () => {
      agentPerformanceTracker.recordExecution("agent-1", {
        success: true,
        data: {},
      });

      agentPerformanceTracker.recordExecution("agent-2", {
        success: true,
        data: {},
      });

      const allMetrics = agentPerformanceTracker.getAllMetrics();
      expect(allMetrics.length).toBe(2);
    });

    it("should reset metrics", () => {
      agentPerformanceTracker.recordExecution("test-agent", {
        success: true,
        data: {},
      });

      agentPerformanceTracker.reset();

      const metrics = agentPerformanceTracker.getMetrics("test-agent");
      expect(metrics).toBeNull();
    });
  });

  describe("getAgentMetrics", () => {
    it("should return metrics structure", async () => {
      const metrics = await getAgentMetrics("test-agent");

      expect(metrics).toHaveProperty("agentName");
      expect(metrics).toHaveProperty("totalExecutions");
      expect(metrics).toHaveProperty("successfulExecutions");
      expect(metrics).toHaveProperty("failedExecutions");
      expect(metrics).toHaveProperty("averageProcessingTime");
      expect(metrics).toHaveProperty("totalCreditsUsed");
      expect(metrics).toHaveProperty("successRate");
    });
  });
});

