/**
 * Script to create a test project with 5 images and A+ content
 * Run with: npx tsx scripts/create-test-project.ts
 */

import { PrismaClient } from "@prisma/client";
import { getServerAuthSession } from "@/lib/auth";

const prisma = new PrismaClient();

// Test product data
const TEST_PROJECT = {
  name: "Premium Wireless Headphones - Test Project",
  productName: "TechSound Pro Wireless Headphones",
  description: "Experience crystal-clear audio with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and premium comfort design. Perfect for music lovers, gamers, and professionals who demand the best.",
  productCategory: "Electronics > Audio > Headphones",
};

// 5 high-quality product images from Unsplash (free to use)
const TEST_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
    order: 0,
    description: "Main product shot - Premium wireless headphones",
  },
  {
    url: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop",
    order: 1,
    description: "Side view showing sleek design",
  },
  {
    url: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&h=800&fit=crop",
    order: 2,
    description: "Comfortable ear cushions detail",
  },
  {
    url: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=800&fit=crop",
    order: 3,
    description: "Person wearing headphones in use",
  },
  {
    url: "https://images.unsplash.com/photo-1599669454699-248893623440?w=800&h=800&fit=crop",
    order: 4,
    description: "Product in lifestyle setting",
  },
];

// Sample A+ Content modules
const TEST_A_PLUS_MODULES = [
  {
    type: "STANDARD_COMPARISON_TABLE",
    content: {
      title: "Why Choose TechSound Pro?",
      comparisonRows: [
        {
          feature: "Battery Life",
          ourProduct: "30 hours",
          competitor: "20 hours",
        },
        {
          feature: "Noise Cancellation",
          ourProduct: "Active ANC",
          competitor: "Passive only",
        },
        {
          feature: "Comfort",
          ourProduct: "Memory foam cushions",
          competitor: "Standard padding",
        },
        {
          feature: "Sound Quality",
          ourProduct: "Hi-Res Audio certified",
          competitor: "Standard quality",
        },
      ],
    },
  },
  {
    type: "STANDARD_FOUR_IMAGE_TEXT_QUADRANT",
    content: {
      title: "Premium Features",
      modules: [
        {
          imageUrl: TEST_IMAGES[0].url,
          headline: "Active Noise Cancellation",
          body: "Block out the world and immerse yourself in pure sound with advanced ANC technology.",
        },
        {
          imageUrl: TEST_IMAGES[1].url,
          headline: "30-Hour Battery Life",
          body: "Listen all day and night with our extended battery that keeps you connected longer.",
        },
        {
          imageUrl: TEST_IMAGES[2].url,
          headline: "Premium Comfort",
          body: "Memory foam ear cushions and adjustable headband ensure comfort during long listening sessions.",
        },
        {
          imageUrl: TEST_IMAGES[3].url,
          headline: "Hi-Res Audio",
          body: "Experience studio-quality sound with support for high-resolution audio formats.",
        },
      ],
    },
  },
  {
    type: "STANDARD_IMAGE_TEXT_OVERLAY",
    content: {
      imageUrl: TEST_IMAGES[4].url,
      headline: "Designed for Your Lifestyle",
      body: "Whether you're working from home, commuting, or hitting the gym, TechSound Pro adapts to your life. Lightweight yet durable, these headphones are built to last.",
    },
  },
  {
    type: "STANDARD_THREE_IMAGE_TEXT_LEFT",
    content: {
      headline: "What's Included",
      body: "Everything you need to start enjoying premium audio right out of the box.",
      modules: [
        {
          imageUrl: TEST_IMAGES[0].url,
          headline: "TechSound Pro Headphones",
        },
        {
          imageUrl: TEST_IMAGES[1].url,
          headline: "Carrying Case",
        },
        {
          imageUrl: TEST_IMAGES[2].url,
          headline: "USB-C Charging Cable",
        },
      ],
    },
  },
];

async function main() {
  console.log("🚀 Creating test project with images and A+ content...\n");

  try {
    // Note: This script needs to be run in a context where we can get the user session
    // For now, we'll need to get the first user or create one
    // In a real scenario, you'd pass the userId or get it from session
    
    // Get the first user (for testing purposes)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          not: null,
        },
      },
    });

    if (!user) {
      console.error("❌ No user found. Please create a user first or sign in.");
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.email} (ID: ${user.id})\n`);

    // Create the project
    console.log("📦 Creating project...");
    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: TEST_PROJECT.name,
        productName: TEST_PROJECT.productName,
        description: TEST_PROJECT.description,
        productCategory: TEST_PROJECT.productCategory,
        status: "DRAFT",
        mainImage: TEST_IMAGES[0].url,
      },
    });

    console.log(`✅ Project created: ${project.id}\n`);

    // Add product images
    console.log("📸 Adding product images...");
    for (const image of TEST_IMAGES) {
      await prisma.projectImage.create({
        data: {
          projectId: project.id,
          url: image.url,
          originalUrl: image.url,
          width: 800,
          height: 800,
          size: 200000, // Approximate size in bytes
          order: image.order,
        },
      });
      console.log(`  ✓ Added image ${image.order + 1}: ${image.description}`);
    }

    console.log(`\n✅ Added ${TEST_IMAGES.length} product images\n`);

    // Create A+ Content
    console.log("📝 Creating A+ content...");
    const aPlusContent = await prisma.aPlusContent.create({
      data: {
        projectId: project.id,
        modules: TEST_A_PLUS_MODULES,
        isPremium: false,
      },
    });

    console.log(`✅ A+ content created with ${TEST_A_PLUS_MODULES.length} modules\n`);

    // Update project status to COMPLETED
    await prisma.project.update({
      where: { id: project.id },
      data: { status: "COMPLETED" },
    });

    console.log("✨ Test project created successfully!\n");
    console.log("📊 Project Summary:");
    console.log(`   Project ID: ${project.id}`);
    console.log(`   Project Name: ${project.name}`);
    console.log(`   Product: ${project.productName}`);
    console.log(`   Images: ${TEST_IMAGES.length}`);
    console.log(`   A+ Modules: ${TEST_A_PLUS_MODULES.length}`);
    console.log(`\n🌐 View your project at: http://localhost:3002/projects/${project.id}`);
    console.log(`📄 View A+ content at: http://localhost:3002/projects/${project.id}/aplus\n`);
  } catch (error) {
    console.error("❌ Error creating test project:", error);
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

