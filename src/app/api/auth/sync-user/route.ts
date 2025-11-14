/**
 * Sync Supabase user to Prisma
 * Called after Supabase authentication to ensure user exists in Prisma
 */

import { NextResponse } from "next/server";
import { syncUserToPrisma } from "@/lib/auth/supabase";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await syncUserToPrisma(userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Sync user error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync user" },
      { status: 500 }
    );
  }
}

