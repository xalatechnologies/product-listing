/**
 * Integration test setup
 * Sets up test database and utilities for integration testing
 */

import { PrismaClient } from '@prisma/client';
import { afterEach } from 'vitest';

// Create a test Prisma client
// In a real scenario, you'd use a separate test database
// For now, we'll use the same database but clean up after tests
export const testPrisma = new PrismaClient({
  log: process.env.DEBUG ? ['query', 'error', 'warn'] : ['error'],
});

// Clean up test data after each test to avoid conflicts
// Using afterEach ensures data is cleaned up after tests complete
// but before the next test's beforeEach runs
afterEach(async () => {
  // Clean up in reverse order of dependencies
  // Only clean up test data (users with test- prefix)
  // This ensures each test starts with a clean database state
  try {
    await testPrisma.generatedImage.deleteMany({
      where: { project: { userId: { startsWith: 'test-' } } },
    });
    await testPrisma.projectImage.deleteMany({
      where: { project: { userId: { startsWith: 'test-' } } },
    });
    await testPrisma.aPlusContent.deleteMany({
      where: { project: { userId: { startsWith: 'test-' } } },
    });
    await testPrisma.export.deleteMany({
      where: { userId: { startsWith: 'test-' } },
    });
    await testPrisma.project.deleteMany({
      where: { userId: { startsWith: 'test-' } },
    });
    await testPrisma.brandKit.deleteMany({
      where: { userId: { startsWith: 'test-' } },
    });
    await testPrisma.creditTransaction.deleteMany({
      where: { userId: { startsWith: 'test-' } },
    });
    await testPrisma.subscription.deleteMany({
      where: { userId: { startsWith: 'test-' } },
    });
    await testPrisma.apiKey.deleteMany({
      where: { userId: { startsWith: 'test-' } },
    });
    await testPrisma.account.deleteMany({
      where: { userId: { startsWith: 'test-' } },
    });
    await testPrisma.session.deleteMany({
      where: { userId: { startsWith: 'test-' } },
    });
    await testPrisma.user.deleteMany({
      where: { id: { startsWith: 'test-' } },
    });
  } catch (error) {
    // Ignore cleanup errors - they might occur if data was already deleted
    // This prevents cleanup failures from masking actual test failures
    if (process.env.DEBUG) {
      console.warn('Cleanup warning:', error);
    }
  }
});

// Helper to create a test user with unique email
export async function createTestUser(email?: string) {
  // Always generate unique email to avoid conflicts in parallel tests
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const uniqueEmail = email 
    ? `${email.split('@')[0]}-${timestamp}-${random}@${email.split('@')[1] || 'example.com'}`
    : `test-${timestamp}-${random}@example.com`;
  const userId = `test-${timestamp}-${random}`;
  
  return await testPrisma.user.create({
    data: {
      id: userId,
      email: uniqueEmail,
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

