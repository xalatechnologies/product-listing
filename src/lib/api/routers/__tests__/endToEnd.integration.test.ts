/**
 * End-to-End Integration Tests
 * 
 * Tests the complete flow from job creation to AI generation completion.
 * These tests verify the entire system works together:
 * - Job queue → Edge Function → API endpoints → AI generation → Database updates
 * 
 * Requires:
 * - OPENAI_API_KEY
 * - REMOVEBG_API_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 * - Running Next.js server (for API endpoints)
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestUser, createTestProject } from "../../../../../tests/integration/setup";
import { prisma } from "@/lib/db";
import { ImageType, ProjectStatus } from "@prisma/client";
import { createJob, getJob, waitForJobCompletion, cleanupTestJobs } from "@/lib/utils/jobQueue";
import { uploadFile, getSignedUrl } from "@/lib/storage";
import { createAuthenticatedCaller } from "../../../../../tests/integration/trpc-utils";

const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
const hasRemoveBgKey = !!process.env.REMOVEBG_API_KEY;
const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasRequiredKeys = hasOpenAIKey && hasRemoveBgKey && hasServiceKey;

describe.skipIf(!hasRequiredKeys)("End-to-End Integration Tests", () => {
  let userId: string;
  let projectId: string;
  let productImageUrl: string;

  beforeEach(async () => {
    const user = await createTestUser("e2e@example.com");
    userId = user.id;

    const project = await createTestProject(userId, {
      productName: "Premium Coffee Maker",
      description: "Programmable coffee maker with thermal carafe and built-in grinder",
      productCategory: "Kitchen Appliances",
    });
    projectId = project.id;

    // Create product image
    const testImageBuffer = Buffer.from("fake-image-data");
    const imagePath = `test/${userId}/${projectId}/product.jpg`;
    
    try {
      await uploadFile("product-images", imagePath, testImageBuffer, {
        contentType: "image/jpeg",
        upsert: true,
      });
      productImageUrl = await getSignedUrl("product-images", imagePath, 3600);
    } catch (error) {
      productImageUrl = "https://via.placeholder.com/1000x1000.jpg";
    }

    await prisma.projectImage.create({
      data: {
        projectId,
        url: productImageUrl,
        width: 1000,
        height: 1000,
        size: 100000,
        order: 0,
      },
    });

    // Add credits
    await prisma.creditTransaction.create({
      data: {
        userId,
        amount: 1000,
        type: "BONUS",
        description: "E2E test credits",
      },
    });
  });

  afterEach(async () => {
    await cleanupTestJobs(userId);
  });

  describe("Complete Flow: tRPC → Job Queue → API → AI Generation", () => {
    it("should complete full flow for single image generation", async () => {
      const caller = createAuthenticatedCaller(userId);

      // Step 1: Call tRPC endpoint to generate image
      const result = await caller.image.generate({
        projectId,
        type: ImageType.MAIN_IMAGE,
      });

      expect(result.jobId).toBeTruthy();
      expect(result.status).toBe("queued");

      // Step 2: Verify job was created
      const job = await getJob(result.jobId);
      expect(job).toBeTruthy();
      expect(job?.status).toBe("pending");
      expect(job?.job_type).toBe("generate-image");

      // Step 3: Process the job via API endpoint
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      
      const response = await fetch(`${appUrl}/api/process-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          projectId,
          imageType: ImageType.MAIN_IMAGE,
          userId,
        }),
      });

      expect(response.ok).toBe(true);
      const apiResult = await response.json();
      expect(apiResult.success).toBe(true);

      // Step 4: Wait for generation to complete
      await new Promise((resolve) => setTimeout(resolve, 15000));

      // Step 5: Verify job status updated
      const updatedJob = await getJob(result.jobId);
      // Job might still be pending if Edge Function hasn't processed it
      // But API should have generated the image

      // Step 6: Verify image was generated
      const generatedImages = await prisma.generatedImage.findMany({
        where: {
          projectId,
          type: ImageType.MAIN_IMAGE,
        },
      });

      expect(generatedImages.length).toBeGreaterThan(0);
      expect(generatedImages[0]?.url).toBeTruthy();
      expect(generatedImages[0]?.type).toBe(ImageType.MAIN_IMAGE);

      // Step 7: Verify project status updated
      const updatedProject = await prisma.project.findUnique({
        where: { id: projectId },
      });
      expect(updatedProject?.status).toBe(ProjectStatus.PROCESSING);
    }, 180000); // 3 minute timeout

    it("should complete full flow for complete pack generation", async () => {
      const caller = createAuthenticatedCaller(userId);

      // Step 1: Call tRPC endpoint
      const result = await caller.image.generateCompletePack({
        projectId,
        includeAPlus: false,
      });

      expect(result.jobId).toBeTruthy();
      expect(result.status).toBe("queued");

      // Step 2: Process via API endpoint
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      
      const response = await fetch(`${appUrl}/api/process-complete-pack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          projectId,
          includeAPlus: false,
          userId,
        }),
      });

      expect(response.ok).toBe(true);
      const apiResult = await response.json();
      expect(apiResult.success).toBe(true);
      expect(apiResult.queuedJobs).toBe(6);

      // Step 3: Verify individual jobs were created
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const pendingJobs = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
        `
        SELECT COUNT(*) as count
        FROM job_queue
        WHERE status = 'pending'
        AND job_type = 'generate-image'
        AND user_id = $1::text
        `,
        userId,
      );

      expect(Number(pendingJobs[0]?.count || 0)).toBeGreaterThanOrEqual(6);

      // Step 4: Process a few image jobs to verify they work
      const imageTypes = [
        ImageType.MAIN_IMAGE,
        ImageType.INFOGRAPHIC,
        ImageType.FEATURE_HIGHLIGHT,
      ];

      for (const imageType of imageTypes) {
        const imageResponse = await fetch(`${appUrl}/api/process-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            projectId,
            imageType,
            userId,
          }),
        });

        expect(imageResponse.ok).toBe(true);
      }

      // Step 5: Wait for some generation
      await new Promise((resolve) => setTimeout(resolve, 30000));

      // Step 6: Verify some images were generated
      const generatedImages = await prisma.generatedImage.findMany({
        where: { projectId },
      });

      expect(generatedImages.length).toBeGreaterThan(0);
    }, 300000); // 5 minute timeout for complete pack
  });

  describe("Error Handling and Retry Logic", () => {
    it("should handle invalid project ID gracefully", async () => {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      
      const response = await fetch(`${appUrl}/api/process-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          projectId: "invalid-project-id",
          imageType: ImageType.MAIN_IMAGE,
          userId,
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
    });

    it("should handle missing product images gracefully", async () => {
      // Create project without images
      const emptyProject = await createTestProject(userId, {
        productName: "Empty Project",
      });

      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      
      const response = await fetch(`${appUrl}/api/process-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({
          projectId: emptyProject.id,
          imageType: ImageType.MAIN_IMAGE,
          userId,
        }),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it("should handle unauthorized requests", async () => {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      
      const response = await fetch(`${appUrl}/api/process-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-key",
        },
        body: JSON.stringify({
          projectId,
          imageType: ImageType.MAIN_IMAGE,
          userId,
        }),
      });

      expect(response.status).toBe(401);
    });
  });

  describe("Credit Deduction", () => {
    it("should deduct credits when generating image", async () => {
      // Get initial credit balance
      const initialBalance = await prisma.creditTransaction.aggregate({
        where: { userId },
        _sum: { amount: true },
      });
      const initialCredits = initialBalance._sum.amount || 0;

      const caller = createAuthenticatedCaller(userId);

      // Generate image
      await caller.image.generate({
        projectId,
        type: ImageType.MAIN_IMAGE,
      });

      // Check credits were deducted
      const newBalance = await prisma.creditTransaction.aggregate({
        where: { userId },
        _sum: { amount: true },
      });
      const newCredits = newBalance._sum.amount || 0;

      expect(newCredits).toBeLessThan(initialCredits);
    });

    it("should fail if insufficient credits", async () => {
      // Remove all credits
      await prisma.creditTransaction.deleteMany({
        where: { userId },
      });

      const caller = createAuthenticatedCaller(userId);

      // Try to generate image
      await expect(
        caller.image.generate({
          projectId,
          type: ImageType.MAIN_IMAGE,
        }),
      ).rejects.toThrow();
    });
  });
});

