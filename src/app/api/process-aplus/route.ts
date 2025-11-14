/**
 * Internal API endpoint for processing A+ content generation jobs
 * Called by Supabase Edge Function to process queued A+ content jobs
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    const { projectId, userId, generateImages } = await req.json();

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

    // Generate A+ content using existing logic
    const { analyzeProductForAPlus } = await import("@/lib/aplus/contentAnalysis");
    const { getRandomTemplateForModule, applyBrandKitToTemplate } = await import("@/lib/aplus/templates");
    const { getStandardModules } = await import("@/lib/aplus/moduleSpecs");

    // Analyze product data
    const analysis = await analyzeProductForAPlus({
      productName: project.productName,
      description: project.description || undefined,
      category: project.productCategory || undefined,
      productImages: project.productImages,
    });

    // Generate modules
    const availableModules = getStandardModules();
    const selectedModules = availableModules.slice(0, Math.min(6, Math.max(4, analysis.modules.length)));

    const generatedModules = selectedModules.map((moduleSpec, index) => {
      const moduleContent = analysis.modules[index] || analysis.modules[0]!;
      const template = getRandomTemplateForModule(moduleSpec.id);

      const finalTemplate = project.brandKit && template
        ? applyBrandKitToTemplate(template, {
            primaryColor: project.brandKit.primaryColor || undefined,
            secondaryColor: project.brandKit.secondaryColor || undefined,
            accentColor: project.brandKit.accentColor || undefined,
          })
        : template;

      return {
        type: moduleSpec.id,
        templateId: finalTemplate?.id || `default-${moduleSpec.id}`,
        content: {
          headline: moduleContent.headline,
          bodyText: moduleContent.bodyText,
          imageDescriptions: moduleContent.imageDescriptions,
          ...moduleContent.additionalContent,
        },
        template: finalTemplate ? JSON.parse(JSON.stringify(finalTemplate)) : null,
      };
    });

    // Create or update APlusContent record
    await prisma.aPlusContent.upsert({
      where: { projectId },
      update: {
        modules: generatedModules as any,
        isPremium: false,
        updatedAt: new Date(),
      },
      create: {
        projectId,
        modules: generatedModules as any,
        isPremium: false,
      },
    });

    // Optionally generate images for A+ content modules
    let generatedImageCount = 0;
    if (generateImages) {
      try {
        const { generateAPlusModuleImages } = await import("@/lib/aplus/imageGeneration");
        const productImageUrl = project.productImages?.[0]?.url;
        
        const imageResults = await generateAPlusModuleImages(
          projectId,
          userId,
          generatedModules,
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
    });
  } catch (error) {
    console.error("A+ processing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "A+ generation failed" },
      { status: 500 },
    );
  }
}

