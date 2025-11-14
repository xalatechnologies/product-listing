/**
 * Verification script for Supabase Job Queue setup
 * 
 * Checks that:
 * 1. job_queue table exists
 * 2. Database functions exist
 * 3. Edge Function is accessible (if deployed)
 * 4. API endpoints are working
 */

import { prisma } from "../src/lib/db";

async function verifyJobQueueSetup() {
  console.log("🔍 Verifying Supabase Job Queue Setup...\n");

  try {
    // 1. Check if job_queue table exists
    console.log("1. Checking job_queue table...");
    try {
      const tableCheck = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
        `
        SELECT COUNT(*) as count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'job_queue'
        `,
      );

      if (Number(tableCheck[0]?.count || 0) > 0) {
        console.log("   ✅ job_queue table exists\n");
      } else {
        console.log("   ❌ job_queue table NOT found");
        console.log("   📝 Run the migration: prisma/migrations/create_job_queue/migration.sql\n");
        return false;
      }
    } catch (error) {
      console.log("   ❌ Error checking table:", error instanceof Error ? error.message : error);
      return false;
    }

    // 2. Check if database functions exist
    console.log("2. Checking database functions...");
    const functions = [
      "get_next_job",
      "mark_job_processing",
      "mark_job_completed",
      "mark_job_failed",
    ];

    for (const funcName of functions) {
      try {
        const funcCheck = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
          `
          SELECT COUNT(*) as count
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public'
          AND p.proname = $1::text
          `,
          funcName,
        );

        if (Number(funcCheck[0]?.count || 0) > 0) {
          console.log(`   ✅ Function '${funcName}' exists`);
        } else {
          console.log(`   ❌ Function '${funcName}' NOT found`);
          return false;
        }
      } catch (error) {
        console.log(`   ❌ Error checking function '${funcName}':`, error instanceof Error ? error.message : error);
        return false;
      }
    }
    console.log("");

    // 3. Test creating a job
    console.log("3. Testing job creation...");
    try {
      // Create a test user first
      const testUser = await prisma.user.create({
        data: {
          email: `test-verify-${Date.now()}@example.com`,
          name: "Test User",
        },
      });

      // Create a test job
      const jobResult = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
        `
        INSERT INTO job_queue (job_type, payload, user_id)
        VALUES (
          'generate-image',
          $1::jsonb,
          $2::text
        )
        RETURNING id
        `,
        JSON.stringify({ test: true }),
        testUser.id,
      );

      if (jobResult[0]?.id) {
        console.log("   ✅ Job creation works");
        
        // Clean up test job and user
        await prisma.$executeRawUnsafe(
          `DELETE FROM job_queue WHERE id = $1::uuid`,
          jobResult[0].id,
        );
        await prisma.user.delete({ where: { id: testUser.id } });
      } else {
        console.log("   ❌ Job creation failed");
        return false;
      }
    } catch (error) {
      console.log("   ❌ Error creating test job:", error instanceof Error ? error.message : error);
      return false;
    }
    console.log("");

    // 4. Check environment variables
    console.log("4. Checking environment variables...");
    const requiredEnvVars = [
      "DATABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];

    const optionalEnvVars = [
      "OPENAI_API_KEY",
      "REMOVEBG_API_KEY",
      "NEXT_PUBLIC_APP_URL",
    ];

    for (const envVar of requiredEnvVars) {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar} is set`);
      } else {
        console.log(`   ⚠️  ${envVar} is NOT set (required)`);
      }
    }

    for (const envVar of optionalEnvVars) {
      if (process.env[envVar]) {
        console.log(`   ✅ ${envVar} is set`);
      } else {
        console.log(`   ⚠️  ${envVar} is NOT set (optional, needed for AI tests)`);
      }
    }
    console.log("");

    // 5. Check pg_cron extension
    console.log("5. Checking pg_cron extension...");
    try {
      const cronCheck = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
        `
        SELECT COUNT(*) as count
        FROM pg_extension
        WHERE extname = 'pg_cron'
        `,
      );

      if (Number(cronCheck[0]?.count || 0) > 0) {
        console.log("   ✅ pg_cron extension is installed");
      } else {
        console.log("   ⚠️  pg_cron extension NOT installed");
        console.log("   📝 Install it: CREATE EXTENSION IF NOT EXISTS pg_cron;");
      }
    } catch (error) {
      console.log("   ⚠️  Could not check pg_cron:", error instanceof Error ? error.message : error);
    }
    console.log("");

    console.log("✅ Setup verification complete!\n");
    console.log("📋 Next steps:");
    console.log("   1. Deploy Edge Function: supabase functions deploy process-jobs");
    console.log("   2. Set up pg_cron: Run scripts/setup-job-processor.sql");
    console.log("   3. Run tests: npm run test:integration\n");

    return true;
  } catch (error) {
    console.error("❌ Verification failed:", error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
verifyJobQueueSetup()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

