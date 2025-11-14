#!/usr/bin/env tsx

/**
 * RLS Policy Verification Script
 * 
 * Verifies that Row Level Security (RLS) policies are enabled on all tables
 * and that storage policies are configured correctly.
 * 
 * Usage: tsx scripts/verify-rls-policies.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing required environment variables:");
  console.error("   - NEXT_PUBLIC_SUPABASE_URL");
  console.error("   - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TABLES = [
  "Project",
  "ProjectImage",
  "GeneratedImage",
  "BrandKit",
  "APlusContent",
  "Subscription",
  "CreditTransaction",
  "ApiKey",
];

const STORAGE_BUCKETS = [
  "product-images",
  "generated-images",
  "brand-kits",
  "exports",
];

async function checkRLSEnabled(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("check_rls_enabled", {
      table_name: tableName,
    });

    if (error) {
      // If RPC doesn't exist, try direct query
      const { data: queryData, error: queryError } = await supabase
        .from("_prisma_migrations")
        .select("*")
        .limit(1);

      // Fallback: Check if we can query the table (if RLS is enabled and no policies, it will fail)
      const { error: testError } = await supabase
        .from(tableName)
        .select("*")
        .limit(0);

      // If we get a permission error, RLS is likely enabled
      return (testError?.code === "42501") || (testError?.message?.includes("permission") ?? false);
    }

    return data === true;
  } catch (error) {
    console.warn(`⚠️  Could not verify RLS for ${tableName}:`, (error as Error).message);
    return false;
  }
}

async function checkRLSPolicies(tableName: string): Promise<number> {
  try {
    // Query pg_policies to count policies for this table
    const { data, error } = await supabase.rpc("get_table_policies", {
      table_name: tableName,
    });

    if (error) {
      // Fallback: Try to query information_schema
      const { data: policies, error: policiesError } = await supabase
        .from("information_schema.table_privileges")
        .select("*")
        .eq("table_name", tableName.toLowerCase())
        .limit(100);

      if (!policiesError && policies) {
        return policies.length;
      }
    }

    return data || 0;
  } catch (error) {
    console.warn(`⚠️  Could not count policies for ${tableName}:`, (error as Error).message);
    return 0;
  }
}

async function checkStorageBucket(bucketName: string): Promise<{ exists: boolean; public: boolean }> {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);

    if (error) {
      return { exists: false, public: false };
    }

    return {
      exists: true,
      public: data.public || false,
    };
  } catch (error) {
    return { exists: false, public: false };
  }
}

async function main() {
  console.log("🔍 Verifying RLS Policies and Storage Configuration...\n");

  let allPassed = true;

  // Check RLS on tables
  console.log("📊 Checking Row Level Security (RLS) on tables:\n");
  for (const table of TABLES) {
    const rlsEnabled = await checkRLSEnabled(table);
    const policyCount = await checkRLSPolicies(table);

    if (rlsEnabled) {
      console.log(`✅ ${table}: RLS enabled`);
      if (policyCount > 0) {
        console.log(`   └─ ${policyCount} policy/policies configured`);
      } else {
        console.log(`   ⚠️  No policies found (RLS enabled but no policies)`);
        allPassed = false;
      }
    } else {
      console.log(`❌ ${table}: RLS not enabled or cannot verify`);
      allPassed = false;
    }
  }

  // Check storage buckets
  console.log("\n📦 Checking Storage Buckets:\n");
  for (const bucket of STORAGE_BUCKETS) {
    const bucketInfo = await checkStorageBucket(bucket);

    if (bucketInfo.exists) {
      const visibility = bucketInfo.public ? "public" : "private";
      console.log(`✅ ${bucket}: Exists (${visibility})`);
    } else {
      console.log(`❌ ${bucket}: Not found`);
      allPassed = false;
    }
  }

  console.log("\n" + "=".repeat(50));
  if (allPassed) {
    console.log("✅ All RLS policies and storage buckets verified!");
  } else {
    console.log("⚠️  Some checks failed. Please review the output above.");
    console.log("\nTo set up RLS policies, see: agent-helpers/docs/SUPABASE-SETUP.md");
  }
  console.log("=".repeat(50));

  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error("❌ Error running verification:", error);
  process.exit(1);
});

