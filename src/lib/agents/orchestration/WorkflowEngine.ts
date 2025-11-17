/**
 * Workflow Engine
 * 
 * Defines and executes complex workflows using agents.
 */

import type { Agent, AgentContext, AgentResult } from "../base";
import { chainAgents, runAgentsInParallel, runConditionalAgent, runFirstSuccessful } from "./AgentOrchestrator";

export type WorkflowStep<TInput = unknown, TOutput = unknown> = {
  id: string;
  name: string;
  agent: Agent<TInput, TOutput>;
  input?: unknown | ((previousOutput: unknown, context: AgentContext) => unknown);
  condition?: (previousOutput: unknown, context: AgentContext) => boolean;
  parallel?: boolean;
  parallelWith?: string[];
};

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
}

export interface WorkflowResult {
  success: boolean;
  stepResults: Map<string, AgentResult<unknown>>;
  finalResult?: AgentResult<unknown>;
  error?: string;
  metadata?: {
    workflowId: string;
    executionTime: number;
    stepsExecuted: number;
  };
}

export class WorkflowEngine {
  /**
   * Execute a workflow definition
   */
  async executeWorkflow(
    workflow: WorkflowDefinition,
    initialInput: unknown,
    context: AgentContext,
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    const stepResults = new Map<string, AgentResult<unknown>>();
    let currentInput = initialInput;
    let stepsExecuted = 0;

    try {
      // Group steps for parallel execution
      const stepGroups: WorkflowStep[][] = [];
      let currentGroup: WorkflowStep[] = [];

      for (const step of workflow.steps) {
        if (step.parallel) {
          if (currentGroup.length > 0) {
            stepGroups.push([...currentGroup]);
            currentGroup = [];
          }
          currentGroup.push(step);
        } else {
          if (currentGroup.length > 0) {
            stepGroups.push([...currentGroup]);
            currentGroup = [];
          }
          currentGroup.push(step);
        }
      }

      if (currentGroup.length > 0) {
        stepGroups.push(currentGroup);
      }

      // Execute step groups
      for (const group of stepGroups) {
        if (group.length === 1) {
          // Sequential step
          const step = group[0]!;
          
          // Check condition
          if (step.condition && !step.condition(currentInput, context)) {
            stepResults.set(step.id, {
              success: true,
              data: null,
              metadata: { skipped: true, reason: "Condition not met" },
            });
            continue;
          }

          // Transform input if needed
          const stepInput = step.input !== undefined
            ? typeof step.input === "function"
              ? step.input(currentInput, context)
              : step.input
            : currentInput;

          // Execute agent
          const result = await step.agent.process(stepInput, {
            ...context,
            metadata: {
              ...context.metadata,
              workflowId: workflow.id,
              stepId: step.id,
            },
          });

          stepResults.set(step.id, result);
          stepsExecuted++;

          if (!result.success) {
            return {
              success: false,
              stepResults,
              error: `Step ${step.name} failed: ${result.error?.message}`,
              metadata: {
                workflowId: workflow.id,
                executionTime: Date.now() - startTime,
                stepsExecuted,
              },
            };
          }

          currentInput = result.data;
        } else {
          // Parallel steps
          const parallelResults = await Promise.all(
            group.map(async (step) => {
              // Check condition
              if (step.condition && !step.condition(currentInput, context)) {
                return {
                  stepId: step.id,
                  result: {
                    success: true,
                    data: null,
                    metadata: { skipped: true, reason: "Condition not met" },
                  },
                };
              }

              // Transform input if needed
              const stepInput = step.input !== undefined
                ? typeof step.input === "function"
                  ? step.input(currentInput, context)
                  : step.input
                : currentInput;

              // Execute agent
              const result = await step.agent.process(stepInput, {
                ...context,
                metadata: {
                  ...context.metadata,
                  workflowId: workflow.id,
                  stepId: step.id,
                },
              });

              return { stepId: step.id, result };
            }),
          );

          // Store results
          for (const { stepId, result } of parallelResults) {
            stepResults.set(stepId, result);
            if (!result.metadata?.skipped) {
              stepsExecuted++;
            }
          }

          // Check for failures
          const failures = parallelResults.filter(({ result }) => !result.success);
          if (failures.length > 0) {
            return {
              success: false,
              stepResults,
              error: `Parallel steps failed: ${failures.map((f) => f.stepId).join(", ")}`,
              metadata: {
                workflowId: workflow.id,
                executionTime: Date.now() - startTime,
                stepsExecuted,
              },
            };
          }

          // Use first result as current input (or combine if needed)
          currentInput = parallelResults[0]!.result.data;
        }
      }

      // Get final result
      const finalStepId = workflow.steps[workflow.steps.length - 1]?.id;
      const finalResult = finalStepId ? stepResults.get(finalStepId) : undefined;

      return {
        success: true,
        stepResults,
        finalResult,
        metadata: {
          workflowId: workflow.id,
          executionTime: Date.now() - startTime,
          stepsExecuted,
        },
      };
    } catch (error) {
      return {
        success: false,
        stepResults,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          workflowId: workflow.id,
          executionTime: Date.now() - startTime,
          stepsExecuted,
        },
      };
    }
  }

  /**
   * Create a simple linear workflow
   */
  createLinearWorkflow(
    id: string,
    name: string,
    agents: Agent[],
    description?: string,
  ): WorkflowDefinition {
    return {
      id,
      name,
      description,
      steps: agents.map((agent, index) => ({
        id: `step-${index}`,
        name: agent.name,
        agent,
      })),
    };
  }
}

