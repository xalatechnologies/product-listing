/**
 * Job Router
 * 
 * Handles job queue status queries and operations
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getJob, getUserJobs, type JobStatus } from "@/lib/utils/jobQueue";

const getJobSchema = z.object({
  jobId: z.string(),
});

const getUserJobsSchema = z.object({
  limit: z.number().int().positive().max(50).default(10),
  status: z.enum(["pending", "processing", "completed", "failed"]).optional(),
});

export const jobRouter = createTRPCRouter({
  /**
   * Get job status by ID
   */
  getStatus: protectedProcedure
    .input(getJobSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const job = await getJob(input.jobId);

      if (!job) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job not found",
        });
      }

      // Verify job belongs to user
      if (job.user_id !== userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view this job",
        });
      }

      return {
        id: job.id,
        jobType: job.job_type,
        status: job.status,
        retryCount: job.retry_count,
        maxRetries: job.max_retries,
        errorMessage: job.error_message,
        createdAt: job.created_at,
        processedAt: job.processed_at,
        completedAt: job.completed_at,
      };
    }),

  /**
   * Get user's jobs
   */
  list: protectedProcedure
    .input(getUserJobsSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const jobs = await getUserJobs(userId, input.limit);

      // Filter by status if provided
      const filteredJobs = input.status
        ? jobs.filter((job) => job.status === input.status)
        : jobs;

      return filteredJobs.map((job) => ({
        id: job.id,
        jobType: job.job_type,
        status: job.status,
        retryCount: job.retry_count,
        maxRetries: job.max_retries,
        errorMessage: job.error_message,
        createdAt: job.created_at,
        processedAt: job.processed_at,
        completedAt: job.completed_at,
        payload: job.payload,
      }));
    }),

  /**
   * Get pending jobs count for user
   */
  getPendingCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const jobs = await getUserJobs(userId, 100);
    const pendingJobs = jobs.filter((job) => job.status === "pending" || job.status === "processing");

    return {
      count: pendingJobs.length,
      pending: jobs.filter((j) => j.status === "pending").length,
      processing: jobs.filter((j) => j.status === "processing").length,
    };
  }),
});

