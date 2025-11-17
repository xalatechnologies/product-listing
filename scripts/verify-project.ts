#!/usr/bin/env tsx

/**
 * Verify Project Script
 * Checks if a project exists and displays its details
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const projectId = process.argv[2] || "cmi32vzqr000p7v1xqa97uiee";

async function main() {
  console.log(`🔍 Checking project: ${projectId}\n`);

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        productImages: {
          orderBy: { order: "asc" },
        },
        generatedImages: {
          orderBy: { createdAt: "desc" },
        },
        aPlusContent: true,
        brandKit: true,
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!project) {
      console.log("❌ Project not found!");
      process.exit(1);
    }

    console.log("✅ Project Found!\n");
    console.log("=".repeat(60));
    console.log("📦 Project Details");
    console.log("=".repeat(60));
    console.log(`ID: ${project.id}`);
    console.log(`Name: ${project.name}`);
    console.log(`Product: ${project.productName}`);
    console.log(`Status: ${project.status}`);
    console.log(`Category: ${project.productCategory || "N/A"}`);
    console.log(`Description: ${project.description?.substring(0, 100)}...`);
    console.log(`\n👤 User: ${project.user.email} (${project.user.name})`);
    console.log(`\n📸 Product Images: ${project.productImages.length}`);
    project.productImages.forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.url.substring(0, 60)}... (${img.width}x${img.height})`);
    });

    console.log(`\n✨ Generated Images: ${project.generatedImages.length}`);
    project.generatedImages.forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.type} - ${img.width}x${img.height} (${img.url.substring(0, 60)}...)`);
    });

    if (project.aPlusContent) {
      const modules = project.aPlusContent.modules as any[];
      console.log(`\n📄 A+ Content: Yes (${modules.length} modules, ${project.aPlusContent.isPremium ? "Premium" : "Standard"})`);
      modules.forEach((module, i) => {
        console.log(`  ${i + 1}. ${module.type} - ${module.content?.headline || "N/A"}`);
      });
    } else {
      console.log(`\n📄 A+ Content: No`);
    }

    if (project.brandKit) {
      console.log(`\n🎨 Brand Kit: ${project.brandKit.name}`);
      console.log(`   Primary: ${project.brandKit.primaryColor}`);
      console.log(`   Secondary: ${project.brandKit.secondaryColor}`);
      console.log(`   Accent: ${project.brandKit.accentColor}`);
    }

    console.log(`\n📅 Created: ${project.createdAt.toLocaleString()}`);
    console.log(`📅 Updated: ${project.updatedAt.toLocaleString()}`);

    console.log("\n" + "=".repeat(60));
    console.log("🌐 URLs");
    console.log("=".repeat(60));
    console.log(`Project: http://localhost:3000/projects/${project.id}`);
    if (project.aPlusContent) {
      console.log(`A+ Content: http://localhost:3000/projects/${project.id}/aplus`);
    }
    console.log(`Edit: http://localhost:3000/projects/${project.id}/edit`);

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

