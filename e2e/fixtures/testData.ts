import { TestUser } from '../helpers/auth';

/**
 * Test users for E2E tests
 */
export const testUsers: Record<string, TestUser> = {
  validUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
    name: 'Test User',
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
    name: 'Admin User',
  },
  newUser: {
    email: `new-${Date.now()}@example.com`,
    password: 'NewPassword123!',
    name: 'New User',
  },
};

/**
 * Test project data
 */
export const testProjects = {
  basic: {
    name: 'Test Project',
    description: 'A test project for E2E testing',
  },
  complete: {
    name: 'Complete Project',
    description: 'A complete project with all fields',
    status: 'active',
  },
};

/**
 * Test brand kit data
 */
export const testBrandKits = {
  basic: {
    name: 'Test Brand Kit',
    primaryColor: '#FF9900',
    secondaryColor: '#232F3E',
    fontFamily: 'Arial',
  },
  complete: {
    name: 'Complete Brand Kit',
    primaryColor: '#FF9900',
    secondaryColor: '#232F3E',
    accentColor: '#146EB4',
    fontFamily: 'Helvetica',
    logoUrl: '/test-logo.png',
  },
};

/**
 * Test file paths for uploads
 */
export const testFiles = {
  validImage: 'tests/fixtures/test-image.jpg',
  validPNG: 'tests/fixtures/test-image.png',
  validLogo: 'tests/fixtures/test-logo.png',
  invalidFile: 'tests/fixtures/invalid-file.txt',
  largeImage: 'tests/fixtures/large-image.jpg',
};
