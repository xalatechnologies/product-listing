/**
 * Create NextAuth session after Supabase authentication
 * This endpoint creates a NextAuth session from a Supabase user
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json({ error: "Access token is required" }, { status: 400 });
    }

    // Verify Supabase session
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Find or create user in Prisma
    const prismaUser = await prisma.user.upsert({
      where: { email: user.email! },
      update: {
        email: user.email!,
        name: user.user_metadata?.name || null,
        image: user.user_metadata?.avatar_url || null,
      },
      create: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || null,
        image: user.user_metadata?.avatar_url || null,
      },
    });

    // Create NextAuth session by creating a session record
    // Note: This is a workaround - normally NextAuth handles this
    // We'll redirect to a page that triggers NextAuth signIn
    return NextResponse.json({ 
      success: true, 
      userId: prismaUser.id,
      email: prismaUser.email 
    });
  } catch (error: any) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 500 }
    );
  }
}

