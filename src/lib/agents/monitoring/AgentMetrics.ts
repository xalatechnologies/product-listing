/**
 * Agent Metrics and Monitoring
 * 
 * Tracks agent performance, success rates, and analytics.
 */

import type { AgentResult } from "../base";
import { prisma } from "@/lib/db";

export interface AgentMetrics {
  /** Agent name */
  agentName: string;
  
  /** Total executions */
  totalExecutions: number;
  
  /** Successful executions */
  successfulExecutions: number;
  
  /** Failed executions */
  failedExecutions: number;
  
  /** Average processing time (ms) */
  averageProcessingTime: number;
  
  /** Total credits used */
  totalCreditsUsed: number;
  
  /** Success rate (0-1) */
  successRate: number;
  
  /** Last execution timestamp */
  lastExecution?: Date;
}

export interface AgentExecutionLog {
  id: string;
  agentName: string;
  agentVersion: string;
  userId: string;
  projectId?: string;
  jobId?: string;
  success: boolean;
  processingTime: number;
  creditsUsed: number;
  errorCode?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

/**
 * Log agent execution for analytics
 */
export async function logAgentExecution(
  agentName: string,
  agentVersion: string,
  result: AgentResult<unknown>,
  context: {
    userId: string;
    projectId?: string;
    jobId?: string;
  },
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    // Store in database (you may want to create a table for this)
    // For now, we'll use a simple logging approach
    // In production, you might want to use a dedicated analytics service
    
    const executionLog: AgentExecutionLog = {
      id: crypto.randomUUID(),
      agentName,
      agentVersion,
      userId: context.userId,
      projectId: context.projectId,
      jobId: context.jobId,
      success: result.success,
      processingTime: result.metadata?.processingTime || 0,
      creditsUsed: result.metadata?.creditsUsed || 0,
      errorCode: result.error?.code,
      errorMessage: result.error?.message,
      metadata: {
        ...result.metadata,
        ...metadata,
      },
      timestamp: new Date(),
    };

    // Log to console (in production, send to analytics service)
    console.log("[Agent Execution]", JSON.stringify(executionLog, null, 2));

    // TODO: Store in database table `agent_executions` if you create one
    // await prisma.agentExecution.create({ data: executionLog });
  } catch (error) {
    // Don't fail the main operation if logging fails
    console.error("Failed to log agent execution:", error);
  }
}

/**
 * Get agent metrics (aggregated statistics)
 */
export async function getAgentMetrics(
  agentName: string,
  userId?: string,
  startDate?: Date,
  endDate?: Date,
): Promise<AgentMetrics> {
  // TODO: Query from database when agent_executions table is created
  // For now, return mock data structure
  
  return {
    agentName,
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    averageProcessingTime: 0,
    totalCreditsUsed: 0,
    successRate: 0,
  };
}

/**
 * Get metrics for all agents
 */
export async function getAllAgentMetrics(
  userId?: string,
  startDate?: Date,
  endDate?: Date,
): Promise<AgentMetrics[]> {
  // TODO: Query from database
  return [];
}

/**
 * Track agent performance in memory (for real-time monitoring)
 */
class AgentPerformanceTracker {
  private metrics = new Map<string, {
    executions: number;
    successes: number;
    failures: number;
    totalTime: number;
    totalCredits: number;
  }>();

  recordExecution(
    agentName: string,
    result: AgentResult<unknown>,
  ): void {
    const current = this.metrics.get(agentName) || {
      executions: 0,
      successes: 0,
      failures: 0,
      totalTime: 0,
      totalCredits: 0,
    };

    current.executions++;
    if (result.success) {
      current.successes++;
    } else {
      current.failures++;
    }
    current.totalTime += result.metadata?.processingTime || 0;
    current.totalCredits += result.metadata?.creditsUsed || 0;

    this.metrics.set(agentName, current);
  }

  getMetrics(agentName: string): AgentMetrics | null {
    const data = this.metrics.get(agentName);
    if (!data) return null;

    return {
      agentName,
      totalExecutions: data.executions,
      successfulExecutions: data.successes,
      failedExecutions: data.failures,
      averageProcessingTime: data.executions > 0 ? data.totalTime / data.executions : 0,
      totalCreditsUsed: data.totalCredits,
      successRate: data.executions > 0 ? data.successes / data.executions : 0,
    };
  }

  getAllMetrics(): AgentMetrics[] {
    return Array.from(this.metrics.keys()).map((name) => this.getMetrics(name)!).filter(Boolean);
  }

  reset(): void {
    this.metrics.clear();
  }
}

export const agentPerformanceTracker = new AgentPerformanceTracker();

