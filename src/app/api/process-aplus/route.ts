/**
 * Internal API endpoint for processing A+ content generation jobs
 * Called by Supabase Edge Function to process queued A+ content jobs
 * Uses Agent system for processing
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { APlusContentAgent } from "@/lib/agents/content/APlusContentAgent";
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

    const { projectId, userId, generateImages, jobId, isPremium } = await req.json();

    if (!projectId || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get project data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        brandKit: true,
        productImages: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create agent context
    const context = createAgentContext({
      userId,
      projectId,
      jobId,
      metadata: { generateImages, isPremium },
    });

    // Use APlusContentAgent to generate content
    const agent = new APlusContentAgent();
    const result = await agent.process(
      {
        productName: project.productName,
        description: project.description || undefined,
        category: project.productCategory || undefined,
        productImages: project.productImages,
        isPremium: isPremium || false,
        brandKit: project.brandKit
          ? {
              primaryColor: project.brandKit.primaryColor,
              secondaryColor: project.brandKit.secondaryColor,
              accentColor: project.brandKit.accentColor,
            }
          : undefined,
        generateImages: generateImages || false,
      },
      context,
    );

    // Log execution
    await logAgentExecution(agent.name, agent.version, result, { userId, projectId, jobId });

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || "A+ content generation failed");
    }

    // Save to database
    await prisma.aPlusContent.upsert({
      where: { projectId },
      update: {
        modules: result.data.modules as any,
        isPremium: result.data.isPremium,
        updatedAt: new Date(),
      },
      create: {
        projectId,
        modules: result.data.modules as any,
        isPremium: result.data.isPremium,
      },
    });

    // Optionally generate images for A+ content modules
    let generatedImageCount = 0;
    if (generateImages && result.data.modules) {
      try {
        const { generateAPlusModuleImages } = await import("@/lib/aplus/imageGeneration");
        const productImageUrl = project.productImages?.[0]?.url;
        
        const imageResults = await generateAPlusModuleImages(
          projectId,
          userId,
          result.data.modules,
          project.productName,
          productImageUrl,
        );
        
        generatedImageCount = imageResults.length;
      } catch (error) {
        console.error("Failed to generate A+ images:", error);
        // Don't fail the entire request if image generation fails
      }
    }

    return NextResponse.json({ 
      success: true,
      generatedImageCount,
      moduleCount: result.data.moduleCount,
    });
  } catch (error) {
    console.error("A+ processing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "A+ generation failed" },
      { status: 500 },
    );
  }
}

