#!/usr/bin/env tsx

/**
 * Fix Generated Image URLs Script
 * 
 * Updates existing generated images in the database to use valid Unsplash URLs
 * instead of fake placeholder URLs.
 * 
 * Usage: tsx scripts/fix-generated-image-urls.ts
 */

import { PrismaClient, ImageType } from "@prisma/client";

const prisma = new PrismaClient();

// Real Unsplash image URLs mapped to image types
const imageTypeUrls: Record<ImageType, string> = {
  [ImageType.MAIN_IMAGE]: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&h=1000&fit=crop",
  [ImageType.INFOGRAPHIC]: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1024&h=1792&fit=crop",
  [ImageType.FEATURE_HIGHLIGHT]: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=1024&h=1024&fit=crop",
  [ImageType.LIFESTYLE]: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1792&h=1024&fit=crop",
  [ImageType.COMPARISON_CHART]: "https://images.unsplash.com/photo-1599669454699-248893623440?w=1024&h=1024&fit=crop",
  [ImageType.DIMENSION_DIAGRAM]: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1024&h=1792&fit=crop",
  [ImageType.A_PLUS_MODULE]: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=1024&h=1024&fit=crop",
};

async function main() {
  console.log("🔧 Fixing generated image URLs...\n");

  try {
    // Find all generated images with fake Unsplash URLs (containing random numbers)
    const generatedImages = await prisma.generatedImage.findMany({
      where: {
        url: {
          contains: "unsplash.com/photo-",
        },
      },
    });

    console.log(`Found ${generatedImages.length} generated images to update\n`);

    if (generatedImages.length === 0) {
      console.log("✅ No images need updating. All URLs are valid.");
      return;
    }

    let updatedCount = 0;

    for (const image of generatedImages) {
      // Check if URL looks like a fake one (has very long number after photo-)
      const urlMatch = image.url.match(/photo-(\d+)/);
      if (urlMatch && urlMatch[1] && urlMatch[1].length > 10) {
        // This is likely a fake URL, update it
        const validUrl = imageTypeUrls[image.type] || imageTypeUrls[ImageType.MAIN_IMAGE]!;
        
        await prisma.generatedImage.update({
          where: { id: image.id },
          data: { url: validUrl },
        });

        updatedCount++;
        console.log(`  ✓ Updated ${image.type} image (${image.id})`);
      }
    }

    console.log(`\n✅ Updated ${updatedCount} generated image URLs`);
    console.log("🎉 All generated images now have valid URLs!\n");
  } catch (error) {
    console.error("❌ Error fixing image URLs:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });

