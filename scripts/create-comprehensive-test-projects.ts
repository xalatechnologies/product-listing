#!/usr/bin/env tsx

/**
 * Create Comprehensive Test Projects Script
 * 
 * Creates multiple test projects with:
 * - Product images (from Unsplash)
 * - Generated images (main, infographic, lifestyle, etc.)
 * - Complete A+ content with multiple modules
 * - Brand kits
 * - Various project statuses
 * 
 * Usage: tsx scripts/create-comprehensive-test-projects.ts
 */

import { PrismaClient, ProjectStatus, ImageType } from "@prisma/client";

const prisma = new PrismaClient();

// Test product definitions
const TEST_PRODUCTS = [
  {
    name: "Premium Wireless Headphones",
    productName: "TechSound Pro Wireless Headphones",
    description: "Experience crystal-clear audio with our premium wireless headphones. Featuring active noise cancellation, 30-hour battery life, and premium comfort design. Perfect for music lovers, gamers, and professionals who demand the best.",
    category: "Electronics > Audio > Headphones",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1000&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=1000&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1000&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1599669454699-248893623440?w=1000&h=1000&fit=crop",
    ],
  },
  {
    name: "Smart Fitness Watch",
    productName: "FitTrack Pro Smart Watch",
    description: "Advanced fitness tracking watch with heart rate monitoring, GPS, sleep tracking, and 7-day battery life. Waterproof design perfect for athletes and fitness enthusiasts.",
    category: "Electronics > Wearable Technology > Smart Watches",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=1000&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1544117519-31a4b719223d?w=1000&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=1000&h=1000&fit=crop",
    ],
  },
  {
    name: "Ergonomic Office Chair",
    productName: "ComfortMax Pro Ergonomic Chair",
    description: "Premium ergonomic office chair with lumbar support, adjustable armrests, and breathable mesh back. Designed for all-day comfort during long work sessions.",
    category: "Furniture > Office Furniture > Chairs",
    images: [
      "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=1000&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1541558866610-5b8b0b0b0b0b?w=1000&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1000&h=1000&fit=crop",
    ],
  },
  {
    name: "Portable Bluetooth Speaker",
    productName: "SoundWave Portable Speaker",
    description: "Compact yet powerful Bluetooth speaker with 360-degree sound, waterproof design, and 20-hour battery life. Perfect for outdoor adventures and home use.",
    category: "Electronics > Audio > Speakers",
    images: [
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=1000&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1000&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=1000&h=1000&fit=crop",
    ],
  },
  {
    name: "Premium Coffee Maker",
    productName: "BrewMaster Pro Coffee Maker",
    description: "Programmable coffee maker with thermal carafe, built-in grinder, and customizable brew strength. Make barista-quality coffee at home every morning.",
    category: "Home & Kitchen > Kitchen Appliances > Coffee Makers",
    images: [
      "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=1000&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=1000&h=1000&fit=crop",
      "https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=1000&h=1000&fit=crop",
    ],
  },
];

// A+ Content module templates
function createAPlusModules(productName: string, images: string[]) {
  return [
    {
      type: "standard-single-image-sidebar",
      templateId: "template-1",
      content: {
        headline: `Why Choose ${productName}?`,
        bodyText: `Discover the premium features and benefits that make ${productName} the perfect choice for your needs.`,
        imageDescriptions: ["Main product image showcasing key features"],
      },
      template: null,
    },
    {
      type: "standard-single-image-highlights",
      templateId: "template-2",
      content: {
        headline: "Key Features",
        bodyText: `Explore the innovative features that set ${productName} apart from the competition.`,
        bullets: [
          "Premium quality materials",
          "Advanced technology",
          "User-friendly design",
          "Long-lasting durability",
          "Excellent value",
        ],
        imageDescriptions: ["Product image highlighting features"],
      },
      template: null,
    },
    {
      type: "standard-four-images-text",
      templateId: "template-3",
      content: {
        headline: "See It In Action",
        bodyText: `Experience ${productName} from every angle and see how it can enhance your daily routine.`,
        imageDescriptions: [
          "Product front view",
          "Product side view",
          "Product detail view",
          "Product in use",
        ],
      },
      template: null,
    },
    {
      type: "standard-comparison-table",
      templateId: "template-4",
      content: {
        headline: "Compare the Difference",
        bodyText: "See how we stack up against the competition.",
        specifications: {
          "Battery Life": "30 hours",
          "Warranty": "2 years",
          "Weight": "Lightweight",
          "Material": "Premium",
        },
      },
      template: null,
    },
  ];
}

async function main() {
  console.log("🚀 Creating comprehensive test projects...\n");

  try {
    // Get or create a test user
    let user = await prisma.user.findFirst({
      where: {
        email: {
          not: null,
        },
      },
    });

    if (!user) {
      console.log("👤 Creating test user...");
      user = await prisma.user.create({
        data: {
          email: "test@example.com",
          name: "Test User",
          emailVerified: new Date(),
        },
      });
      console.log(`✅ Created user: ${user.email}\n`);
    } else {
      console.log(`✅ Using existing user: ${user.email}\n`);
    }

    // Create a brand kit
    console.log("🎨 Creating brand kit...");
    let brandKit = await prisma.brandKit.findFirst({
      where: {
        userId: user.id,
        name: "Test Brand Kit",
      },
    });

    if (!brandKit) {
      brandKit = await prisma.brandKit.create({
        data: {
          userId: user.id,
          name: "Test Brand Kit",
          primaryColor: "#2563EB",
          secondaryColor: "#10B981",
          accentColor: "#F59E0B",
          isDefault: true,
        },
      });
    }
    console.log(`✅ Brand kit ready\n`);

    // Create projects
    const createdProjects = [];

    for (let i = 0; i < TEST_PRODUCTS.length; i++) {
      const product = TEST_PRODUCTS[i]!;
      const status = i < 2 ? ProjectStatus.COMPLETED : i === 2 ? ProjectStatus.PROCESSING : ProjectStatus.DRAFT;

      console.log(`📦 Creating project ${i + 1}/${TEST_PRODUCTS.length}: ${product.productName}...`);

      // Create project
      const project = await prisma.project.create({
        data: {
          userId: user.id,
          name: product.name,
          productName: product.productName,
          description: product.description,
          productCategory: product.category,
          status,
          mainImage: product.images[0],
          brandKitId: brandKit.id,
        },
      });

      // Add product images
      console.log(`  📸 Adding ${product.images.length} product images...`);
      for (let j = 0; j < product.images.length; j++) {
        await prisma.projectImage.create({
          data: {
            projectId: project.id,
            url: product.images[j]!,
            originalUrl: product.images[j]!,
            width: 1000,
            height: 1000,
            size: 200000 + Math.floor(Math.random() * 100000),
            order: j,
          },
        });
      }

      // Add generated images for completed projects
      if (status === ProjectStatus.COMPLETED) {
        console.log(`  ✨ Adding generated images...`);
        
        const generatedImageTypes = [
          { type: ImageType.MAIN_IMAGE, width: 1000, height: 1000 },
          { type: ImageType.INFOGRAPHIC, width: 1024, height: 1792 },
          { type: ImageType.FEATURE_HIGHLIGHT, width: 1024, height: 1024 },
          { type: ImageType.LIFESTYLE, width: 1792, height: 1024 },
        ];

        // Real Unsplash image URLs for different image types
        const unsplashImageUrls = [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&h=1000&fit=crop", // Main image
          "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=1024&h=1792&fit=crop", // Infographic
          "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=1024&h=1024&fit=crop", // Feature highlight
          "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1792&h=1024&fit=crop", // Lifestyle
        ];

        for (let idx = 0; idx < generatedImageTypes.length; idx++) {
          const imgType = generatedImageTypes[idx]!;
          await prisma.generatedImage.create({
            data: {
              projectId: project.id,
              type: imgType.type,
              url: unsplashImageUrls[idx] || unsplashImageUrls[0]!,
              width: imgType.width,
              height: imgType.height,
              size: 250000 + Math.floor(Math.random() * 100000),
              style: "default",
              metadata: {
                generated: true,
                timestamp: new Date().toISOString(),
                testData: true,
              },
            },
          });
        }
        console.log(`  ✅ Added ${generatedImageTypes.length} generated images`);
      }

      // Add A+ content for completed projects
      if (status === ProjectStatus.COMPLETED) {
        console.log(`  📝 Creating A+ content...`);
        await prisma.aPlusContent.create({
          data: {
            projectId: project.id,
            modules: createAPlusModules(product.productName, product.images),
            isPremium: i === 0, // First project gets premium
          },
        });
        console.log(`  ✅ A+ content created with 4 modules`);
      }

      createdProjects.push({
        id: project.id,
        name: project.name,
        status,
        productName: project.productName,
        imageCount: product.images.length,
        hasGeneratedImages: status === ProjectStatus.COMPLETED,
        hasAPlusContent: status === ProjectStatus.COMPLETED,
      });

      console.log(`✅ Project ${i + 1} created successfully\n`);
    }

    // Summary
    console.log("=".repeat(60));
    console.log("✅ All test projects created successfully!");
    console.log("=".repeat(60));
    console.log("\n📊 Summary:\n");

    createdProjects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.productName}`);
      console.log(`   Status: ${project.status}`);
      console.log(`   Product Images: ${project.imageCount}`);
      console.log(`   Generated Images: ${project.hasGeneratedImages ? "Yes (4)" : "No"}`);
      console.log(`   A+ Content: ${project.hasAPlusContent ? "Yes (4 modules)" : "No"}`);
      console.log(`   View: http://localhost:3000/projects/${project.id}`);
      if (project.hasAPlusContent) {
        console.log(`   A+ Content: http://localhost:3000/projects/${project.id}/aplus`);
      }
      console.log("");
    });

    console.log("🎉 Done! You can now test the application with these projects.");
  } catch (error) {
    console.error("❌ Error creating test projects:", error);
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

