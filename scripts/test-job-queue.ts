/**
 * Test script to verify job queue system is working
 * 
 * Creates a test job and monitors its processing
 */

import { prisma } from "../src/lib/db";
import { createJob, getJob, waitForJobCompletion } from "../src/lib/utils/jobQueue";
import { ImageType } from "@prisma/client";

async function testJobQueue() {
  console.log("🧪 Testing Supabase Job Queue System...\n");

  try {
    // Get a test user and project
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log("❌ No users found. Please create a user first.");
      return;
    }

    const project = await prisma.project.findFirst({
      where: { userId: user.id },
    });

    if (!project) {
      console.log("❌ No projects found. Please create a project first.");
      return;
    }

    console.log(`✅ Using user: ${user.email}`);
    console.log(`✅ Using project: ${project.productName}\n`);

    // Create a test job
    console.log("1. Creating test job...");
    const jobId = await createJob(
      "generate-image",
      {
        projectId: project.id,
        imageType: ImageType.MAIN_IMAGE,
      },
      user.id,
    );

    console.log(`   ✅ Job created: ${jobId}\n`);

    // Check job status
    console.log("2. Checking job status...");
    const job = await getJob(jobId);
    if (job) {
      console.log(`   Status: ${job.status}`);
      console.log(`   Job Type: ${job.job_type}`);
      console.log(`   Created: ${job.created_at}\n`);
    }

    // Wait a bit for processing
    console.log("3. Waiting for job processing (30 seconds)...");
    console.log("   (pg_cron runs every 10 seconds, Edge Function should process it)\n");

    // Check status every 5 seconds
    for (let i = 0; i < 6; i++) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const updatedJob = await getJob(jobId);
      if (updatedJob) {
        console.log(`   [${(i + 1) * 5}s] Status: ${updatedJob.status}`);
        if (updatedJob.status === "completed" || updatedJob.status === "failed") {
          console.log(`   ✅ Job finished with status: ${updatedJob.status}`);
          if (updatedJob.error_message) {
            console.log(`   Error: ${updatedJob.error_message}`);
          }
          break;
        }
      }
    }

    // Final status check
    console.log("\n4. Final job status:");
    const finalJob = await getJob(jobId);
    if (finalJob) {
      console.log(`   Status: ${finalJob.status}`);
      console.log(`   Retry Count: ${finalJob.retry_count}`);
      if (finalJob.processed_at) {
        console.log(`   Processed: ${finalJob.processed_at}`);
      }
      if (finalJob.completed_at) {
        console.log(`   Completed: ${finalJob.completed_at}`);
      }
      if (finalJob.error_message) {
        console.log(`   Error: ${finalJob.error_message}`);
      }
    }

    // Check job queue statistics
    console.log("\n5. Job Queue Statistics:");
    const stats = await prisma.$queryRawUnsafe<Array<{
      status: string;
      count: number;
    }>>(`
      SELECT 
        status,
        COUNT(*) as count
      FROM job_queue
      GROUP BY status
      ORDER BY status
    `);

    stats.forEach((stat) => {
      console.log(`   ${stat.status}: ${stat.count}`);
    });

    console.log("\n✅ Test complete!\n");
    console.log("📝 Notes:");
    console.log("   - If job status is 'pending', pg_cron may need more time");
    console.log("   - Check Edge Function logs in Supabase Dashboard");
    console.log("   - Verify NEXT_PUBLIC_APP_URL is set in Edge Function settings");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testJobQueue()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

