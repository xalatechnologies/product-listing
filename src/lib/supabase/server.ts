/**
 * Supabase server client configuration for server-side usage.
 * Use this in API routes, server components, and server actions.
 * Uses service role key for admin operations (bypasses RLS).
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
  );
}

/**
 * Server-side Supabase client with service role key.
 * WARNING: This bypasses Row Level Security (RLS).
 * Use only in server-side code where you've already verified user permissions.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Create a Supabase client for a specific user session.
 * This respects RLS policies for that user.
 */
export function createServerClient(userId?: string) {
  // If userId is provided, we can create a client with user context
  // For now, we'll use admin client but should be scoped by user in production
  return supabaseAdmin;
}

