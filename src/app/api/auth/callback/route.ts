/**
 * Supabase Auth callback handler
 *
 * Handles OAuth callbacks and magic link redirects from Supabase Auth.
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { syncUserToPrisma } from "@/lib/auth/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(new URL("/auth/error", request.url));
    }

    if (data.user) {
      // Sync user to Prisma database
      try {
        await syncUserToPrisma(data.user.id);
      } catch (syncError) {
        console.error("Failed to sync user to Prisma:", syncError);
        // Continue anyway - user can be synced later
      }
    }

    // Redirect to intended page or dashboard
    return NextResponse.redirect(new URL(next, request.url));
  }

  // No code parameter, redirect to home
  return NextResponse.redirect(new URL("/", request.url));
}

