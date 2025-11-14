/**
 * Internal API endpoint for processing complete pack generation jobs
 * Called by Supabase Edge Function to process queued complete pack jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ProjectStatus, ImageType } from "@prisma/client";

// Verify this is called from Supabase Edge Function
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    // Verify authorization (from Supabase Edge Function)
    const authHeader = req.headers.get("authorization");
    const expectedAuth = `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;
    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, includeAPlus, userId } = await req.json();

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get project with product images
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        productImages: {
          orderBy: { order: "asc" },
          take: 1,
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.productImages || project.productImages.length === 0) {
      return NextResponse.json(
        { error: "Project has no product images" },
        { status: 400 },
      );
    }

    const productImageUrl = project.productImages[0]!.url;

    // Update project status to PROCESSING
    await prisma.project.update({
      where: { id: projectId },
      data: { status: ProjectStatus.PROCESSING },
    });

    // Queue individual image generation jobs (process one at a time to avoid timeout)
    const imageTypes = [
      ImageType.MAIN_IMAGE,
      ImageType.INFOGRAPHIC,
      ImageType.FEATURE_HIGHLIGHT,
      ImageType.LIFESTYLE,
      ImageType.COMPARISON_CHART,
      ImageType.DIMENSION_DIAGRAM,
    ];

    // Insert jobs for each image type
    for (const imageType of imageTypes) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO job_queue (job_type, payload, user_id, max_retries)
        VALUES (
          'generate-image',
          $1::jsonb,
          $2::text,
          2
        )
      `, JSON.stringify({
        projectId,
        imageType,
      }), userId);
    }

    // If A+ content requested, queue it separately
    if (includeAPlus) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO job_queue (job_type, payload, user_id, max_retries)
        VALUES (
          'generate-aplus',
          $1::jsonb,
          $2::text,
          2
        )
      `, JSON.stringify({
        projectId,
      }), userId);
    }

    // Note: Project status will be updated to COMPLETED by the last image job
    // The process-image endpoint checks if all images are generated

    return NextResponse.json({ 
      success: true,
      queuedJobs: imageTypes.length + (includeAPlus ? 1 : 0),
      message: `Queued ${imageTypes.length} image generation jobs${includeAPlus ? " and A+ content" : ""}`,
    });
  } catch (error) {
    console.error("Complete pack processing error:", error);
    
    // Update project status to FAILED
    try {
      const body = await req.json();
      if (body.projectId) {
        await prisma.project.update({
          where: { id: body.projectId },
          data: { status: ProjectStatus.FAILED },
        });
      }
    } catch (updateError) {
      console.error("Failed to update project status:", updateError);
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 },
    );
  }
}

