/**
 * Feedback API endpoint
 * Handles user feedback submission
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const feedbackSchema = z.object({
  message: z.string().min(1).max(5000),
  email: z.string().email().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerAuthSession();
    const body = await req.json();

    // Validate input
    const validated = feedbackSchema.parse(body);

    // Get user ID if authenticated, otherwise use email
    const userId = session?.user?.id || null;
    const email = validated.email || session?.user?.email || null;

    // Create feedback record
    const feedback = await prisma.feedback.create({
      data: {
        userId,
        email,
        message: validated.message,
        metadata: validated.metadata || {
          userAgent: req.headers.get("user-agent"),
          url: req.headers.get("referer"),
          timestamp: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        id: feedback.id,
        message: "Thank you for your feedback!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Feedback submission error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

