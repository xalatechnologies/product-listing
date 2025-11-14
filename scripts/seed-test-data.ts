#!/usr/bin/env tsx

/**
 * Seed Test Data Script
 * 
 * Creates test users and sample data for integration testing
 * 
 * Usage: tsx scripts/seed-test-data.ts
 */

import { PrismaClient } from '@prisma/client';
import { ProjectStatus, SubscriptionPlan, SubscriptionStatus, CreditType } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('   Make sure DATABASE_URL is set in your .env file');
    console.error('   Error:', (error as Error).message);
    return false;
  }
}

async function main() {
  console.log('🌱 Seeding test data...\n');

  // Check database connection
  console.log('🔌 Checking database connection...');
  const connected = await checkDatabaseConnection();
  if (!connected) {
    process.exit(1);
  }
  console.log('✅ Database connected\n');

  // Clean up existing test data
  console.log('🧹 Cleaning up existing test data...');
  await prisma.generatedImage.deleteMany({ where: { project: { userId: { startsWith: 'test-' } } } });
  await prisma.projectImage.deleteMany({ where: { project: { userId: { startsWith: 'test-' } } } });
  await prisma.aPlusContent.deleteMany({ where: { project: { userId: { startsWith: 'test-' } } } });
  await prisma.export.deleteMany({ where: { userId: { startsWith: 'test-' } } });
  await prisma.project.deleteMany({ where: { userId: { startsWith: 'test-' } } });
  await prisma.brandKit.deleteMany({ where: { userId: { startsWith: 'test-' } } });
  await prisma.creditTransaction.deleteMany({ where: { userId: { startsWith: 'test-' } } });
  await prisma.subscription.deleteMany({ where: { userId: { startsWith: 'test-' } } });
  await prisma.apiKey.deleteMany({ where: { userId: { startsWith: 'test-' } } });
  await prisma.account.deleteMany({ where: { userId: { startsWith: 'test-' } } });
  await prisma.session.deleteMany({ where: { userId: { startsWith: 'test-' } } });
  await prisma.user.deleteMany({ where: { id: { startsWith: 'test-' } } });

  // Create test users
  console.log('👤 Creating test users...');
  
  const user1 = await prisma.user.create({
    data: {
      id: 'test-user-1',
      email: 'test-user-1@example.com',
      name: 'Test User 1',
      emailVerified: new Date(),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      id: 'test-user-2',
      email: 'test-user-2@example.com',
      name: 'Test User 2',
      emailVerified: new Date(),
    },
  });

  const user3 = await prisma.user.create({
    data: {
      id: 'test-user-3',
      email: 'test-user-3@example.com',
      name: 'Test User 3 (Professional)',
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Created users: ${user1.email}, ${user2.email}, ${user3.email}`);

  // Create subscriptions
  console.log('\n💳 Creating subscriptions...');
  
  const subscription1 = await prisma.subscription.create({
    data: {
      userId: user1.id,
      plan: SubscriptionPlan.STARTER,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  const subscription3 = await prisma.subscription.create({
    data: {
      userId: user3.id,
      plan: SubscriptionPlan.PROFESSIONAL,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ Created subscriptions for ${user1.email} (Starter) and ${user3.email} (Professional)`);

  // Create credit transactions
  console.log('\n💰 Creating credit transactions...');
  
  await prisma.creditTransaction.createMany({
    data: [
      {
        userId: user1.id,
        amount: 10,
        type: CreditType.SUBSCRIPTION,
        description: 'Monthly subscription credits',
      },
      {
        userId: user2.id,
        amount: 5,
        type: CreditType.PURCHASE,
        description: 'Credit purchase',
      },
      {
        userId: user3.id,
        amount: 50,
        type: CreditType.SUBSCRIPTION,
        description: 'Monthly subscription credits',
      },
      {
        userId: user3.id,
        amount: -2,
        type: CreditType.USAGE,
        description: 'Image generation',
      },
    ],
  });

  console.log('✅ Created credit transactions');

  // Create brand kits
  console.log('\n🎨 Creating brand kits...');
  
  const brandKit1 = await prisma.brandKit.create({
    data: {
      userId: user1.id,
      name: 'Test Brand Kit 1',
      primaryColor: '#FF0000',
      secondaryColor: '#00FF00',
      accentColor: '#0000FF',
      isDefault: true,
    },
  });

  const brandKit2 = await prisma.brandKit.create({
    data: {
      userId: user1.id,
      name: 'Test Brand Kit 2',
      primaryColor: '#000000',
      secondaryColor: '#FFFFFF',
      accentColor: '#FF00FF',
    },
  });

  console.log(`✅ Created brand kits for ${user1.email}`);

  // Create projects
  console.log('\n📦 Creating projects...');
  
  const project1 = await prisma.project.create({
    data: {
      userId: user1.id,
      name: 'Test Project 1',
      productName: 'Test Product 1',
      description: 'This is a test project',
      status: ProjectStatus.DRAFT,
      brandKitId: brandKit1.id,
    },
  });

  const project2 = await prisma.project.create({
    data: {
      userId: user1.id,
      name: 'Test Project 2',
      productName: 'Test Product 2',
      description: 'Another test project',
      status: ProjectStatus.COMPLETED,
      brandKitId: brandKit2.id,
    },
  });

  const project3 = await prisma.project.create({
    data: {
      userId: user2.id,
      name: 'Other User Project',
      productName: 'Other Product',
      description: 'This belongs to user 2',
      status: ProjectStatus.DRAFT,
    },
  });

  const project4 = await prisma.project.create({
    data: {
      userId: user3.id,
      name: 'Professional User Project',
      productName: 'Professional Product',
      description: 'Project with generated images',
      status: ProjectStatus.COMPLETED,
    },
  });

  console.log(`✅ Created projects for all users`);

  // Create project images
  console.log('\n🖼️  Creating project images...');
  
  await prisma.projectImage.createMany({
    data: [
      {
        projectId: project1.id,
        url: 'https://example.com/image1.jpg',
        width: 1000,
        height: 1000,
        size: 100000,
        order: 0,
      },
      {
        projectId: project1.id,
        url: 'https://example.com/image2.jpg',
        width: 1000,
        height: 1000,
        size: 120000,
        order: 1,
      },
      {
        projectId: project4.id,
        url: 'https://example.com/image3.jpg',
        width: 1000,
        height: 1000,
        size: 150000,
        order: 0,
      },
    ],
  });

  console.log('✅ Created project images');

  // Create generated images
  console.log('\n✨ Creating generated images...');
  
  await prisma.generatedImage.createMany({
    data: [
      {
        projectId: project4.id,
        type: 'MAIN_IMAGE',
        url: 'https://example.com/generated-main.jpg',
        width: 1000,
        height: 1000,
        size: 200000,
      },
      {
        projectId: project4.id,
        type: 'INFOGRAPHIC',
        url: 'https://example.com/generated-infographic.jpg',
        width: 1000,
        height: 1500,
        size: 250000,
      },
    ],
  });

  console.log('✅ Created generated images');

  // Create A+ content
  console.log('\n📄 Creating A+ content...');
  
  await prisma.aPlusContent.create({
    data: {
      projectId: project4.id,
      modules: [
        {
          type: 'single-image-sidebar',
          title: 'Feature 1',
          description: 'This is a feature description',
          imageUrl: 'https://example.com/module1.jpg',
        },
        {
          type: 'four-images-text',
          title: 'Key Benefits',
          items: [
            { text: 'Benefit 1', imageUrl: 'https://example.com/benefit1.jpg' },
            { text: 'Benefit 2', imageUrl: 'https://example.com/benefit2.jpg' },
          ],
        },
      ],
      isPremium: false,
    },
  });

  console.log('✅ Created A+ content');

  // Create exports
  console.log('\n📤 Creating export records...');
  
  await prisma.export.createMany({
    data: [
      {
        userId: user3.id,
        projectId: project4.id,
        platform: 'AMAZON',
        downloadUrl: 'https://example.com/export1.zip',
        filePath: `${user3.id}/${project4.id}/amazon-1234567890.zip`,
        fileSize: 5000000,
        imageCount: 5,
      },
      {
        userId: user3.id,
        projectId: project4.id,
        platform: 'EBAY',
        downloadUrl: 'https://example.com/export2.zip',
        filePath: `${user3.id}/${project4.id}/ebay-1234567891.zip`,
        fileSize: 4500000,
        imageCount: 5,
      },
    ],
  });

  console.log('✅ Created export records');

  console.log('\n' + '='.repeat(50));
  console.log('✅ Test data seeded successfully!');
  console.log('='.repeat(50));
  console.log('\nTest Users:');
  console.log(`  - ${user1.email} (Starter Plan, 10 credits)`);
  console.log(`  - ${user2.email} (Free Plan, 5 credits)`);
  console.log(`  - ${user3.email} (Professional Plan, 48 credits)`);
  console.log('\nProjects:');
  console.log(`  - ${project1.name} (User 1, Draft)`);
  console.log(`  - ${project2.name} (User 1, Completed)`);
  console.log(`  - ${project3.name} (User 2, Draft)`);
  console.log(`  - ${project4.name} (User 3, Completed, with images)`);
  console.log('\nYou can now run integration tests with: npm run test:integration');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

