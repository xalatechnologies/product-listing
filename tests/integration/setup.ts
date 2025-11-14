/**
 * Integration test setup
 * Sets up test database and utilities for integration testing
 */

import { PrismaClient } from '@prisma/client';
import { beforeEach, afterEach } from 'vitest';

// Create a test Prisma client
// In a real scenario, you'd use a separate test database
// For now, we'll use the same database but clean up after tests
export const testPrisma = new PrismaClient({
  log: process.env.DEBUG ? ['query', 'error', 'warn'] : ['error'],
});

// Clean up test data after each test
afterEach(async () => {
  // Clean up in reverse order of dependencies
  await testPrisma.generatedImage.deleteMany({});
  await testPrisma.projectImage.deleteMany({});
  await testPrisma.aPlusContent.deleteMany({});
  await testPrisma.project.deleteMany({});
  await testPrisma.brandKit.deleteMany({});
  await testPrisma.creditTransaction.deleteMany({});
  await testPrisma.subscription.deleteMany({});
  await testPrisma.apiKey.deleteMany({});
  await testPrisma.account.deleteMany({});
  await testPrisma.session.deleteMany({});
  await testPrisma.user.deleteMany({});
});

// Helper to create a test user
export async function createTestUser(email: string = 'test@example.com') {
  return await testPrisma.user.create({
    data: {
      email,
      emailVerified: new Date(),
      name: 'Test User',
    },
  });
}

// Helper to create a test session
export async function createTestSession(userId: string) {
  return await testPrisma.session.create({
    data: {
      userId,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
      sessionToken: `test-session-${Date.now()}`,
    },
  });
}

// Helper to create a test project
export async function createTestProject(userId: string, data?: Partial<any>) {
  return await testPrisma.project.create({
    data: {
      userId,
      name: data?.name || 'Test Project',
      productName: data?.productName || 'Test Product',
      description: data?.description || 'Test Description',
      status: data?.status || 'DRAFT',
      ...data,
    },
  });
}

// Helper to create a test brand kit
export async function createTestBrandKit(userId: string, data?: Partial<any>) {
  return await testPrisma.brandKit.create({
    data: {
      userId,
      name: data?.name || 'Test Brand Kit',
      primaryColor: data?.primaryColor || '#000000',
      secondaryColor: data?.secondaryColor || '#FFFFFF',
      accentColor: data?.accentColor || '#FF0000',
      ...data,
    },
  });
}

