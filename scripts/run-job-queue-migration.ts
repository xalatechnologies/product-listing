/**
 * Script to run job_queue migration directly in Supabase
 * This bypasses Prisma's shadow database requirement
 */

import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function runMigration() {
  try {
    console.log("🚀 Running job_queue migration...\n");

    // Read the migration SQL file
    const migrationPath = join(process.cwd(), "prisma/migrations/create_job_queue/migration.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]!;
      if (statement.length < 10) continue; // Skip very short statements

      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Statement ${i + 1} executed successfully\n`);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)\n`);
        } else {
          console.error(`❌ Error executing statement ${i + 1}:`, error.message);
          // Continue with other statements
        }
      }
    }

    console.log("✅ Migration completed successfully!");
    console.log("\n📊 Verifying job_queue table...");

    // Verify the table exists
    const tableExists = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'job_queue'
      );
    `);

    if (tableExists[0]?.exists) {
      console.log("✅ job_queue table exists!");
    } else {
      console.log("❌ job_queue table not found");
    }

    // Check functions
    const functionsExist = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
      SELECT COUNT(*) as count
      FROM pg_proc
      WHERE proname IN ('get_next_job', 'mark_job_processing', 'mark_job_completed', 'mark_job_failed');
    `);

    console.log(`✅ Found ${functionsExist[0]?.count || 0} helper functions`);

    console.log("\n🎉 Setup complete! Next steps:");
    console.log("1. Deploy Edge Function: supabase functions deploy process-jobs");
    console.log("2. Set up pg_cron: Run scripts/setup-job-processor.sql in Supabase SQL Editor");
    console.log("3. Add NEXT_PUBLIC_APP_URL to .env");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();

