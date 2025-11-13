import { test, expect } from '@playwright/test';
import { signIn, signUp, signOut, isAuthenticated } from './helpers/auth';
import { testUsers } from './fixtures/testData';

test.describe('Authentication', () => {
  test.describe('Sign In', () => {
    test('should display sign in page', async ({ page }) => {
      await page.goto('/auth/signin');

      await expect(page.locator('h1')).toContainText(/sign in/i);
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/auth/signin');

      await page.click('button[type="submit"]');

      // Wait for validation errors
      await expect(page.locator('text=/email.*required/i')).toBeVisible();
      await expect(page.locator('text=/password.*required/i')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/signin');

      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/invalid.*credentials/i')).toBeVisible();
    });

    test.skip('should successfully sign in with valid credentials', async ({ page }) => {
      await signIn(page, testUsers.validUser);

      // Verify successful authentication
      expect(await isAuthenticated(page)).toBe(true);

      // Should be redirected to dashboard
      await expect(page).toHaveURL('/');
    });

    test('should persist session after page reload', async ({ page }) => {
      test.skip(); // Skip until authentication is set up

      await signIn(page, testUsers.validUser);

      await page.reload();

      expect(await isAuthenticated(page)).toBe(true);
    });
  });

  test.describe('Sign Up', () => {
    test('should display sign up page', async ({ page }) => {
      await page.goto('/auth/signin');

      // Navigate to sign-up if there's a link
      const signUpLink = page.locator('text=Sign up');
      if (await signUpLink.count() > 0) {
        await signUpLink.click();

        await expect(page.locator('h1')).toContainText(/sign up/i);
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="password"]')).toBeVisible();
      }
    });

    test('should show validation errors for invalid email', async ({ page }) => {
      test.skip(); // Skip until sign-up page is confirmed

      await page.goto('/auth/signin');
      await page.click('text=Sign up');

      await page.fill('input[name="email"]', 'invalid-email');
      await page.fill('input[name="password"]', 'password123');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/invalid.*email/i')).toBeVisible();
    });

    test('should show validation errors for weak password', async ({ page }) => {
      test.skip(); // Skip until sign-up page is confirmed

      await page.goto('/auth/signin');
      await page.click('text=Sign up');

      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', '123'); // Too short
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/password.*weak|short/i')).toBeVisible();
    });

    test.skip('should successfully create a new account', async ({ page }) => {
      await signUp(page, testUsers.newUser);

      expect(await isAuthenticated(page)).toBe(true);
      await expect(page).toHaveURL('/');
    });

    test.skip('should show error for duplicate email', async ({ page }) => {
      await page.goto('/auth/signin');
      await page.click('text=Sign up');

      await page.fill('input[name="email"]', testUsers.validUser.email);
      await page.fill('input[name="password"]', 'NewPassword123!');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/email.*already.*exists/i')).toBeVisible();
    });
  });

  test.describe('Sign Out', () => {
    test.skip('should successfully sign out', async ({ page }) => {
      await signIn(page, testUsers.validUser);

      await signOut(page);

      expect(await isAuthenticated(page)).toBe(false);
    });

    test.skip('should clear session data on sign out', async ({ page }) => {
      await signIn(page, testUsers.validUser);

      await signOut(page);

      // Try to access protected route
      await page.goto('/dashboard');

      // Should be redirected to sign-in
      await expect(page).toHaveURL(/\/auth\/signin/);
    });
  });

  test.describe('Protected Routes', () => {
    test.skip('should redirect to sign-in for unauthenticated users', async ({ page }) => {
      const protectedRoutes = [
        '/dashboard',
        '/projects',
        '/brand-kits',
        '/settings',
      ];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(/\/auth\/signin/);
      }
    });

    test.skip('should allow access to protected routes for authenticated users', async ({ page }) => {
      await signIn(page, testUsers.validUser);

      const protectedRoutes = [
        '/dashboard',
        '/projects',
        '/brand-kits',
        '/settings',
      ];

      for (const route of protectedRoutes) {
        await page.goto(route);
        await expect(page).toHaveURL(route);
      }
    });
  });

  test.describe('Session Management', () => {
    test.skip('should maintain session across tabs', async ({ browser }) => {
      const context = await browser.newContext();
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      await signIn(page1, testUsers.validUser);

      expect(await isAuthenticated(page2)).toBe(true);

      await context.close();
    });

    test.skip('should handle session expiry', async ({ page }) => {
      // This would require mocking session expiry time
      test.setTimeout(60000);

      await signIn(page, testUsers.validUser);

      // Mock session expiry by manipulating cookies or waiting
      // Implementation depends on your session management

      // After expiry, user should be redirected to sign-in
      await page.reload();
      await expect(page).toHaveURL(/\/auth\/signin/);
    });
  });
});
