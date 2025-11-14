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

    // Check if session already exists
    const existingSession = await prisma.session.findFirst({
      where: {
        userId: prismaUser.id,
        expires: {
          gt: new Date(),
        },
      },
      orderBy: {
        expires: "desc",
      },
    });

    let sessionToken: string;
    let expires: Date;

    if (existingSession && existingSession.expires > new Date()) {
      // Reuse existing valid session
      sessionToken = existingSession.sessionToken;
      expires = existingSession.expires;
    } else {
      // Create new NextAuth session token
      sessionToken = randomBytes(32).toString("hex");
      expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      // Delete any expired sessions for this user
      await prisma.session.deleteMany({
        where: {
          userId: prismaUser.id,
          expires: {
            lt: new Date(),
          },
        },
      });

      // Create session in database (NextAuth format)
      await prisma.session.create({
        data: {
          sessionToken,
          userId: prismaUser.id,
          expires,
        },
      });
    }

    // Set session cookie
    // NextAuth uses "next-auth.session-token" in dev and "__Secure-next-auth.session-token" in prod
    const isProduction = process.env.NODE_ENV === "production";
    const cookieName = isProduction 
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

    const response = NextResponse.json({ 
      success: true,
      userId: prismaUser.id,
      email: prismaUser.email,
      sessionToken: sessionToken // For debugging
    });
    
    // Set the cookie with proper settings
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    // In development, also set without secure flag for localhost
    if (!isProduction) {
      // NextAuth might also check for this cookie name
      response.cookies.set("next-auth.session-token", sessionToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }

    console.log("Session created for user:", prismaUser.email, "Token:", sessionToken.substring(0, 10) + "...");
    
    return response;
  } catch (error: any) {
    console.error("Create session error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create session" },
      { status: 500 }
    );
  }
}

