/**
 * Integration tests for Supabase Job Queue system
 * 
 * Tests the job queue functionality including:
 * - Job creation
 * - Job processing
 * - Status updates
 * - Retry logic
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestUser, createTestProject } from "../../../../../tests/integration/setup";
import { prisma } from "@/lib/db";
import {
  createJob,
  getJob,
  getPendingJobs,
  getJobsByStatus,
  getUserJobs,
  waitForJobCompletion,
  cleanupTestJobs,
  type JobType,
} from "@/lib/utils/jobQueue";
import { ImageType } from "@prisma/client";

describe("Job Queue Integration Tests", () => {
  let userId: string;
  let projectId: string;

  beforeEach(async () => {
    const user = await createTestUser("jobqueue@example.com");
    userId = user.id;

    const project = await createTestProject(userId, {
      productName: "Test Product for Job Queue",
    });
    projectId = project.id;
  });

  afterEach(async () => {
    await cleanupTestJobs(userId);
  });

  describe("Job Creation", () => {
    it("should create a generate-image job", async () => {
      const jobId = await createJob(
        "generate-image",
        {
          projectId,
          imageType: ImageType.MAIN_IMAGE,
        },
        userId,
      );

      expect(jobId).toBeTruthy();

      const job = await getJob(jobId);
      expect(job).toBeTruthy();
      expect(job?.job_type).toBe("generate-image");
      expect(job?.status).toBe("pending");
      expect(job?.payload).toMatchObject({
        projectId,
        imageType: ImageType.MAIN_IMAGE,
      });
      expect(job?.user_id).toBe(userId);
    });

    it("should create a generate-complete-pack job", async () => {
      const jobId = await createJob(
        "generate-complete-pack",
        {
          projectId,
          includeAPlus: false,
        },
        userId,
      );

      expect(jobId).toBeTruthy();

      const job = await getJob(jobId);
      expect(job).toBeTruthy();
      expect(job?.job_type).toBe("generate-complete-pack");
      expect(job?.status).toBe("pending");
    });

    it("should create a generate-aplus job", async () => {
      const jobId = await createJob(
        "generate-aplus",
        {
          projectId,
        },
        userId,
      );

      expect(jobId).toBeTruthy();

      const job = await getJob(jobId);
      expect(job).toBeTruthy();
      expect(job?.job_type).toBe("generate-aplus");
      expect(job?.status).toBe("pending");
    });

    it("should respect max_retries parameter", async () => {
      const jobId = await createJob(
        "generate-image",
        { projectId, imageType: ImageType.MAIN_IMAGE },
        userId,
        5,
      );

      const job = await getJob(jobId);
      expect(job?.max_retries).toBe(5);
    });
  });

  describe("Job Retrieval", () => {
    it("should get pending jobs", async () => {
      // Create multiple jobs
      await createJob("generate-image", { projectId, imageType: ImageType.MAIN_IMAGE }, userId);
      await createJob("generate-image", { projectId, imageType: ImageType.INFOGRAPHIC }, userId);
      await createJob("generate-aplus", { projectId }, userId);

      const pendingJobs = await getPendingJobs(10);
      expect(pendingJobs.length).toBeGreaterThanOrEqual(3);

      // All should be pending
      pendingJobs.forEach((job) => {
        expect(job.status).toBe("pending");
      });
    });

    it("should get jobs by status", async () => {
      // Create a job and mark it as completed manually
      const jobId = await createJob(
        "generate-image",
        { projectId, imageType: ImageType.MAIN_IMAGE },
        userId,
      );

      // Manually update status to completed
      await prisma.$executeRawUnsafe(
        `
        UPDATE job_queue
        SET status = 'completed', completed_at = NOW()
        WHERE id = $1::uuid
        `,
        jobId,
      );

      const completedJobs = await getJobsByStatus("completed", 10);
      expect(completedJobs.length).toBeGreaterThanOrEqual(1);
      expect(completedJobs.some((j) => j.id === jobId)).toBe(true);
    });

    it("should get jobs for a specific user", async () => {
      const otherUser = await createTestUser("other@example.com");

      // Create jobs for both users
      await createJob("generate-image", { projectId, imageType: ImageType.MAIN_IMAGE }, userId);
      await createJob(
        "generate-image",
        { projectId, imageType: ImageType.MAIN_IMAGE },
        otherUser.id,
      );

      const userJobs = await getUserJobs(userId, 10);
      expect(userJobs.length).toBeGreaterThanOrEqual(1);
      userJobs.forEach((job: { user_id: string | null }) => {
        expect(job.user_id).toBe(userId);
      });
    });
  });

  describe("Job Status Updates", () => {
    it("should mark job as processing", async () => {
      const jobId = await createJob(
        "generate-image",
        { projectId, imageType: ImageType.MAIN_IMAGE },
        userId,
      );

      await prisma.$executeRawUnsafe(
        `
        SELECT mark_job_processing($1::uuid)
        `,
        jobId,
      );

      const job = await getJob(jobId);
      expect(job?.status).toBe("processing");
      expect(job?.processed_at).toBeTruthy();
    });

    it("should mark job as completed", async () => {
      const jobId = await createJob(
        "generate-image",
        { projectId, imageType: ImageType.MAIN_IMAGE },
        userId,
      );

      await prisma.$executeRawUnsafe(
        `
        SELECT mark_job_completed($1::uuid)
        `,
        jobId,
      );

      const job = await getJob(jobId);
      expect(job?.status).toBe("completed");
      expect(job?.completed_at).toBeTruthy();
    });

    it("should handle retry logic on failure", async () => {
      const jobId = await createJob(
        "generate-image",
        { projectId, imageType: ImageType.MAIN_IMAGE },
        userId,
        2, // max 2 retries
      );

      // First failure - should retry
      await prisma.$executeRawUnsafe(
        `
        SELECT mark_job_failed($1::uuid, $2::text)
        `,
        jobId,
        "Test error",
      );

      let job = await getJob(jobId);
      expect(job?.status).toBe("pending"); // Should be retried
      expect(job?.retry_count).toBe(1);
      expect(job?.error_message).toBe("Test error");

      // Second failure - should retry again
      await prisma.$executeRawUnsafe(
        `
        SELECT mark_job_failed($1::uuid, $2::text)
        `,
        jobId,
        "Test error 2",
      );

      job = await getJob(jobId);
      expect(job?.status).toBe("pending"); // Should be retried
      expect(job?.retry_count).toBe(2);

      // Third failure - should mark as failed permanently
      await prisma.$executeRawUnsafe(
        `
        SELECT mark_job_failed($1::uuid, $2::text)
        `,
        jobId,
        "Test error 3",
      );

      job = await getJob(jobId);
      expect(job?.status).toBe("failed");
      expect(job?.retry_count).toBe(2); // Max retries reached
      expect(job?.completed_at).toBeTruthy();
    });
  });

  describe("Job Queue Functions", () => {
    it("should get next job using get_next_job function", async () => {
      // Create multiple jobs
      const jobId1 = await createJob(
        "generate-image",
        { projectId, imageType: ImageType.MAIN_IMAGE },
        userId,
      );
      await createJob("generate-image", { projectId, imageType: ImageType.INFOGRAPHIC }, userId);

      // Get next job
      const result = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `
        SELECT * FROM get_next_job()
        `,
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]?.id).toBe(jobId1); // Should get the first one
    });

    it("should lock job when getting next job (FOR UPDATE SKIP LOCKED)", async () => {
      // Create a job
      const jobId = await createJob(
        "generate-image",
        { projectId, imageType: ImageType.MAIN_IMAGE },
        userId,
      );

      // Get next job (this should lock it)
      const result1 = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `
        SELECT * FROM get_next_job()
        `,
      );

      expect(result1.length).toBeGreaterThan(0);

      // Mark it as processing
      if (result1[0]?.id) {
        await prisma.$executeRawUnsafe(
          `
          SELECT mark_job_processing($1::uuid)
          `,
          result1[0].id,
        );
      }

      // Get next job again - should not get the same one
      const result2 = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `
        SELECT * FROM get_next_job()
        `,
      );

      // Should be empty or different job
      if (result2.length > 0) {
        expect(result2[0]?.id).not.toBe(jobId);
      }
    });
  });
});

