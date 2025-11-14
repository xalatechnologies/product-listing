/**
 * Internal API endpoint for processing image generation jobs
 * Called by Supabase Edge Function to process queued jobs
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

    const { projectId, imageType, style, userId } = await req.json();

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

    // Generate image based on type
    switch (imageType) {
      case ImageType.MAIN_IMAGE: {
        const { generateMainImage } = await import("@/lib/ai/generators/mainImage");
        await generateMainImage(productImageUrl, projectId, userId);
        break;
      }
      case ImageType.INFOGRAPHIC: {
        const { generateInfographic } = await import("@/lib/ai/generators/infographic");
        await generateInfographic(projectId, userId, undefined, style);
        break;
      }
      case ImageType.FEATURE_HIGHLIGHT: {
        const { generateFeatureHighlight } = await import("@/lib/ai/generators/featureHighlight");
        await generateFeatureHighlight(projectId, userId, undefined, style);
        break;
      }
      case ImageType.LIFESTYLE: {
        const { generateLifestyle } = await import("@/lib/ai/generators/lifestyle");
        await generateLifestyle(projectId, userId, undefined, style);
        break;
      }
      case ImageType.COMPARISON_CHART: {
        const { generateComparisonChart } = await import("@/lib/ai/generators/comparisonChart");
        await generateComparisonChart(projectId, userId, "features", style);
        break;
      }
      case ImageType.DIMENSION_DIAGRAM: {
        const { generateDimensionDiagram } = await import("@/lib/ai/generators/dimensionDiagram");
        await generateDimensionDiagram(projectId, userId, undefined, style);
        break;
      }
      default:
        throw new Error(`Unknown image type: ${imageType}`);
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

