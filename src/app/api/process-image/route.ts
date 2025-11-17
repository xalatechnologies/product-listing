/**
 * Internal API endpoint for processing image generation jobs
 * Called by Supabase Edge Function to process queued jobs
 * Uses Agent system for processing
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ProjectStatus, ImageType } from "@prisma/client";
import {
  MainImageAgent,
  InfographicAgent,
  FeatureHighlightAgent,
  LifestyleAgent,
  ComparisonChartAgent,
  DimensionDiagramAgent,
} from "@/lib/agents/generation";
import { createAgentContext } from "@/lib/agents/base";
import { logAgentExecution } from "@/lib/agents/monitoring";

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

    const { projectId, imageType, style, userId, jobId } = await req.json();

    if (!projectId || !imageType || !userId) {
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

    // Create agent context
    const context = createAgentContext({
      userId,
      projectId,
      jobId,
      metadata: { imageType, style },
    });

    // Generate image based on type using agents
    let result;
    let agent;
    
    switch (imageType) {
      case ImageType.MAIN_IMAGE: {
        agent = new MainImageAgent();
        result = await agent.process(
          {
            productImageUrl,
            projectId,
            userId,
          },
          context,
        );
        break;
      }
      case ImageType.INFOGRAPHIC: {
        agent = new InfographicAgent();
        result = await agent.process(
          {
            projectId,
            userId,
            style,
          },
          context,
        );
        break;
      }
      case ImageType.FEATURE_HIGHLIGHT: {
        agent = new FeatureHighlightAgent();
        result = await agent.process(
          {
            projectId,
            userId,
            style,
          },
          context,
        );
        break;
      }
      case ImageType.LIFESTYLE: {
        agent = new LifestyleAgent();
        result = await agent.process(
          {
            projectId,
            userId,
            style,
          },
          context,
        );
        break;
      }
      case ImageType.COMPARISON_CHART: {
        agent = new ComparisonChartAgent();
        result = await agent.process(
          {
            projectId,
            userId,
            comparisonType: "features",
            style,
          },
          context,
        );
        break;
      }
      case ImageType.DIMENSION_DIAGRAM: {
        agent = new DimensionDiagramAgent();
        result = await agent.process(
          {
            projectId,
            userId,
            style,
          },
          context,
        );
        break;
      }
      default:
        throw new Error(`Unknown image type: ${imageType}`);
    }
    
    // Log execution for all agents
    if (agent && result) {
      await logAgentExecution(agent.name, agent.version, result, { userId, projectId, jobId });
      
      if (!result.success) {
        throw new Error(result.error?.message || `${imageType} generation failed`);
      }
    }

    // Check if all images are generated, then update status to COMPLETED
    const generatedImages = await prisma.generatedImage.findMany({
      where: { projectId },
    });

    // If we have at least the main image, mark as completed
    // (Complete pack will have 6+ images)
    const hasMainImage = generatedImages.some(img => img.type === ImageType.MAIN_IMAGE);
    
    if (hasMainImage) {
      // Check if this is part of a complete pack (6 images expected)
      const expectedImageCount = 6;
      if (generatedImages.length >= expectedImageCount) {
        await prisma.project.update({
          where: { id: projectId },
          data: { status: ProjectStatus.COMPLETED },
        });
      } else {
        // Still processing - keep as PROCESSING
        // Status will be updated when all images are done
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Image processing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Processing failed" },
      { status: 500 },
    );
  }
}

