/**
 * Job Queue Utility Functions
 * 
 * Helper functions for interacting with the Supabase job_queue table
 * Used for testing and direct job queue operations
 */

import { prisma } from "@/lib/db";

export type JobType = "generate-image" | "generate-complete-pack" | "generate-aplus";
export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface JobQueueRecord {
  id: string;
  job_type: JobType;
  payload: Record<string, unknown>;
  status: JobStatus;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  created_at: Date;
  processed_at: Date | null;
  completed_at: Date | null;
  user_id: string | null;
}

/**
 * Create a job in the queue
 */
export async function createJob(
  jobType: JobType,
  payload: Record<string, unknown>,
  userId: string,
  maxRetries: number = 3,
): Promise<string> {
  const result = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
    `
    INSERT INTO job_queue (job_type, payload, user_id, max_retries)
    VALUES ($1::text, $2::jsonb, $3::text, $4::int)
    RETURNING id
    `,
    jobType,
    JSON.stringify(payload),
    userId,
    maxRetries,
  );

  return result[0]?.id || "";
}

/**
 * Get a job by ID
 */
export async function getJob(jobId: string): Promise<JobQueueRecord | null> {
  const result = await prisma.$queryRawUnsafe<Array<JobQueueRecord>>(
    `
    SELECT 
      id,
      job_type,
      payload,
      status,
      retry_count,
      max_retries,
      error_message,
      created_at,
      processed_at,
      completed_at,
      user_id
    FROM job_queue
    WHERE id = $1::uuid
    `,
    jobId,
  );

  return result[0] || null;
}

/**
 * Get all pending jobs
 */
export async function getPendingJobs(limit: number = 10): Promise<JobQueueRecord[]> {
  const result = await prisma.$queryRawUnsafe<Array<JobQueueRecord>>(
    `
    SELECT 
      id,
      job_type,
      payload,
      status,
      retry_count,
      max_retries,
      error_message,
      created_at,
      processed_at,
      completed_at,
      user_id
    FROM job_queue
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT $1::int
    `,
    limit,
  );

  return result;
}

/**
 * Get jobs by status
 */
export async function getJobsByStatus(
  status: JobStatus,
  limit: number = 10,
): Promise<JobQueueRecord[]> {
  const result = await prisma.$queryRawUnsafe<Array<JobQueueRecord>>(
    `
    SELECT 
      id,
      job_type,
      payload,
      status,
      retry_count,
      max_retries,
      error_message,
      created_at,
      processed_at,
      completed_at,
      user_id
    FROM job_queue
    WHERE status = $1::text
    ORDER BY created_at DESC
    LIMIT $2::int
    `,
    status,
    limit,
  );

  return result;
}

/**
 * Get jobs for a specific user
 */
export async function getUserJobs(
  userId: string,
  limit: number = 10,
): Promise<JobQueueRecord[]> {
  const result = await prisma.$queryRawUnsafe<Array<JobQueueRecord>>(
    `
    SELECT 
      id,
      job_type,
      payload,
      status,
      retry_count,
      max_retries,
      error_message,
      created_at,
      processed_at,
      completed_at,
      user_id
    FROM job_queue
    WHERE user_id = $1::text
    ORDER BY created_at DESC
    LIMIT $2::int
    `,
    userId,
    limit,
  );

  return result;
}

/**
 * Wait for a job to complete (for testing)
 */
export async function waitForJobCompletion(
  jobId: string,
  timeoutMs: number = 60000,
  pollIntervalMs: number = 1000,
): Promise<JobQueueRecord> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const job = await getJob(jobId);
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (job.status === "completed" || job.status === "failed") {
      return job;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Job ${jobId} did not complete within ${timeoutMs}ms`);
}

/**
 * Clean up test jobs (for testing)
 */
export async function cleanupTestJobs(userId: string): Promise<void> {
  await prisma.$executeRawUnsafe(
    `
    DELETE FROM job_queue
    WHERE user_id = $1::text
    `,
    userId,
  );
}

