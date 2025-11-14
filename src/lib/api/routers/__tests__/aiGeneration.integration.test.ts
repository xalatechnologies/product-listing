/**
 * Integration tests for AI image generation with real API calls
 * 
 * These tests require:
 * - OPENAI_API_KEY environment variable
 * - REMOVEBG_API_KEY environment variable (for main image)
 * - A test project with product images
 * 
 * These tests actually call AI services and generate real content.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestUser, createTestProject } from "../../../../../tests/integration/setup";
import { prisma } from "@/lib/db";
import { ImageType, ProjectStatus } from "@prisma/client";
import { createJob, waitForJobCompletion, cleanupTestJobs } from "@/lib/utils/jobQueue";
import { uploadFile, getSignedUrl } from "@/lib/storage";

// Skip tests if API keys are not available
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
const hasRemoveBgKey = !!process.env.REMOVEBG_API_KEY;
const hasRequiredKeys = hasOpenAIKey && hasRemoveBgKey;

describe.skipIf(!hasRequiredKeys)(
  "AI Generation Integration Tests (Real API Calls)",
  () => {
    let userId: string;
    let projectId: string;
    let productImageUrl: string;

    beforeEach(async () => {
      const user = await createTestUser("aigeneration@example.com");
      userId = user.id;

      const project = await createTestProject(userId, {
        productName: "Wireless Bluetooth Headphones",
        description: "Premium noise-cancelling headphones with 30-hour battery life",
        productCategory: "Electronics",
      });
      projectId = project.id;

      // Create a test product image
      // In a real scenario, you'd upload an actual image
      // For testing, we'll create a placeholder URL
      const testImageBuffer = Buffer.from("fake-image-data");
      const imagePath = `test/${userId}/${projectId}/product.jpg`;
      
      try {
        await uploadFile("product-images", imagePath, testImageBuffer, {
          contentType: "image/jpeg",
          upsert: true,
        });
        productImageUrl = await getSignedUrl("product-images", imagePath, 3600);
      } catch (error) {
        // If storage fails, use a placeholder URL
        productImageUrl = "https://via.placeholder.com/1000x1000.jpg";
      }

      // Create ProjectImage record
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

      // Add credits to user for testing
      await prisma.creditTransaction.create({
        data: {
          userId,
          amount: 1000, // Enough credits for testing
          type: "BONUS",
          description: "Test credits for AI generation tests",
        },
      });
    });

    afterEach(async () => {
      await cleanupTestJobs(userId);
    });

    describe("Main Image Generation", () => {
      it("should generate main image via job queue", async () => {
        // Create job
        const jobId = await createJob(
          "generate-image",
          {
            projectId,
            imageType: ImageType.MAIN_IMAGE,
          },
          userId,
        );

        expect(jobId).toBeTruthy();

        // In a real scenario, the Edge Function would process this
        // For testing, we can manually call the API endpoint
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
          throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        
        // Call the process-image endpoint directly
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
        const result = await response.json();
        expect(result.success).toBe(true);

        // Wait a bit for async processing
        await new Promise((resolve) => setTimeout(resolve, 5000));

        // Check that image was generated
        const generatedImages = await prisma.generatedImage.findMany({
          where: {
            projectId,
            type: ImageType.MAIN_IMAGE,
          },
        });

        expect(generatedImages.length).toBeGreaterThan(0);
        expect(generatedImages[0]?.url).toBeTruthy();
        expect(generatedImages[0]?.type).toBe(ImageType.MAIN_IMAGE);
      }, 120000); // 2 minute timeout for AI generation
    });

    describe("Infographic Generation", () => {
      it("should generate infographic via job queue", async () => {
        const jobId = await createJob(
          "generate-image",
          {
            projectId,
            imageType: ImageType.INFOGRAPHIC,
            style: "premium",
          },
          userId,
        );

        expect(jobId).toBeTruthy();

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceRoleKey) {
          throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        
        const response = await fetch(`${appUrl}/api/process-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({
            projectId,
            imageType: ImageType.INFOGRAPHIC,
            style: "premium",
            userId,
          }),
        });

        expect(response.ok).toBe(true);

        // Wait for generation
        await new Promise((resolve) => setTimeout(resolve, 10000));

        const generatedImages = await prisma.generatedImage.findMany({
          where: {
            projectId,
            type: ImageType.INFOGRAPHIC,
          },
        });

        expect(generatedImages.length).toBeGreaterThan(0);
      }, 120000);
    });
  },
);

describe.skipIf(!hasRequiredKeys)(
  "Complete Pack Generation Integration Tests",
  () => {
    let userId: string;
    let projectId: string;
    let productImageUrl: string;

    beforeEach(async () => {
      const user = await createTestUser("completepack@example.com");
      userId = user.id;

      const project = await createTestProject(userId, {
        productName: "Smart Watch Pro",
        description: "Advanced fitness tracking smartwatch with GPS and heart rate monitor",
        productCategory: "Electronics",
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
          description: "Test credits",
        },
      });
    });

    afterEach(async () => {
      await cleanupTestJobs(userId);
    });

    it("should generate complete pack via job queue", async () => {
      // Create complete pack job
      const jobId = await createJob(
        "generate-complete-pack",
        {
          projectId,
          includeAPlus: false,
        },
        userId,
      );

      expect(jobId).toBeTruthy();

      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      
      // Call process-complete-pack endpoint
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
      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.queuedJobs).toBe(6); // 6 image types

      // Wait for jobs to be queued
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check that individual image jobs were created
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

      // Note: In a real scenario, you'd wait for all jobs to complete
      // This would require the Edge Function to be running
    }, 30000);
  },
);

describe.skipIf(!hasOpenAIKey)("A+ Content Generation Integration Tests", () => {
  let userId: string;
  let projectId: string;

  beforeEach(async () => {
    const user = await createTestUser("aplus@example.com");
    userId = user.id;

    const project = await createTestProject(userId, {
      productName: "Ergonomic Office Chair",
      description: "Comfortable ergonomic chair with lumbar support and adjustable height",
      productCategory: "Furniture",
    });
    projectId = project.id;

    // Create product images
    await prisma.projectImage.create({
      data: {
        projectId,
        url: "https://via.placeholder.com/1000x1000.jpg",
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
        description: "Test credits",
      },
    });
  });

  afterEach(async () => {
    await cleanupTestJobs(userId);
  });

  it("should generate A+ content via job queue", async () => {
    const jobId = await createJob(
      "generate-aplus",
      {
        projectId,
      },
      userId,
    );

    expect(jobId).toBeTruthy();

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY not set");
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    const response = await fetch(`${appUrl}/api/process-aplus`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        projectId,
        userId,
      }),
    });

    expect(response.ok).toBe(true);
    const result = await response.json();
    expect(result.success).toBe(true);

    // Wait for generation
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Check that A+ content was created
    const aPlusContent = await prisma.aPlusContent.findUnique({
      where: { projectId },
    });

    expect(aPlusContent).toBeTruthy();
    expect(aPlusContent?.modules).toBeTruthy();
    expect(Array.isArray(aPlusContent?.modules)).toBe(true);
    expect((aPlusContent?.modules as unknown[]).length).toBeGreaterThan(0);
  }, 120000);
});

