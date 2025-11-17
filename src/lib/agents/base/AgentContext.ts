/**
 * Agent Context
 * 
 * Shared context passed to all agents during processing.
 * Contains user, project, and job information.
 */

export interface AgentContext {
  /** User ID executing the agent */
  readonly userId: string;
  
  /** Project ID (if applicable) */
  readonly projectId?: string;
  
  /** Job ID from job queue (if applicable) */
  readonly jobId?: string;
  
  /** Additional metadata */
  readonly metadata?: Record<string, unknown>;
  
  /** Request timestamp */
  readonly timestamp?: Date;
}

/**
 * Create agent context from common parameters
 */
export function createAgentContext(params: {
  userId: string;
  projectId?: string;
  jobId?: string;
  metadata?: Record<string, unknown>;
}): AgentContext {
  return {
    userId: params.userId,
    projectId: params.projectId,
    jobId: params.jobId,
    metadata: params.metadata,
    timestamp: new Date(),
  };
}

