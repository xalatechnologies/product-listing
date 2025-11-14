/**
 * Create NextAuth session from Supabase authentication
 * This bridges Supabase auth with NextAuth sessions for middleware compatibility
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

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
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);

    if (userError || !user || !user.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Find or create user in Prisma
    const prismaUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        email: user.email,
        name: user.user_metadata?.name || null,
        image: user.user_metadata?.avatar_url || null,
      },
      create: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || null,
        image: user.user_metadata?.avatar_url || null,
      },
    });

    // Create NextAuth session token
    const sessionToken = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Create session in database (NextAuth format)
    await prisma.session.create({
      data: {
        sessionToken,
        userId: prismaUser.id,
        expires,
      },
    });

    // Set session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set("next-auth.session-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 500 }
    );
  }
}

