import { Page } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  name?: string;
}

/**
 * Sign in to the application
 */
export async function signIn(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth/signin');

  // Fill in the sign-in form
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * Sign up a new user
 */
export async function signUp(page: Page, user: TestUser): Promise<void> {
  await page.goto('/auth/signin');

  // Navigate to sign-up
  await page.click('text=Sign up');

  // Fill in the sign-up form
  if (user.name) {
    await page.fill('input[name="name"]', user.name);
  }
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL('/', { timeout: 10000 });
}

/**
 * Sign out of the application
 */
export async function signOut(page: Page): Promise<void> {
  // Click on user menu
  await page.click('[data-testid="user-menu"]');

  // Click sign out button
  await page.click('text=Sign out');

  // Wait for navigation to landing page
  await page.waitForURL('/', { timeout: 5000 });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}
