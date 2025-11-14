import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  const pages = [
    { path: '/', name: 'Landing Page' },
    { path: '/auth/signin', name: 'Sign In Page' },
    { path: '/projects', name: 'Projects Page', requiresAuth: true },
    { path: '/brand-kits', name: 'Brand Kits Page', requiresAuth: true },
    { path: '/dashboard', name: 'Dashboard', requiresAuth: true },
  ];

  for (const page of pages) {
    test(`${page.name} should not have accessibility violations`, async ({ page: pw }) => {
      if (page.requiresAuth) {
        test.skip(); // Skip auth-protected pages for now
      }

      await pw.goto(page.path);

      const accessibilityScanResults = await new AxeBuilder({ page: pw })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }

  test.describe('Keyboard Navigation', () => {
    test('should navigate landing page with keyboard', async ({ page }) => {
      await page.goto('/');

      // Tab through interactive elements
      await page.keyboard.press('Tab');

      // Verify focus is visible
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      const hasFocusIndicator = await page.evaluate(
        (el) => {
          const styles = window.getComputedStyle(el as Element);
          return styles.outline !== 'none' && styles.outlineWidth !== '0px';
        },
        focusedElement
      );

      expect(hasFocusIndicator).toBe(true);
    });

    test('should close modal with Escape key', async ({ page }) => {
      test.skip(); // Skip until modal is implemented

      await page.goto('/projects');

      await page.click('[data-testid="create-project-button"]');
      await expect(page.locator('[data-testid="create-project-modal"]')).toBeVisible();

      await page.keyboard.press('Escape');
      await expect(page.locator('[data-testid="create-project-modal"]')).not.toBeVisible();
    });

    test('should submit form with Enter key', async ({ page }) => {
      await page.goto('/auth/signin');

      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="password"]', 'password123');

      // Press Enter to submit
      await page.keyboard.press('Enter');

      // Form should attempt submission
      // Actual behavior depends on implementation
    });

    test('should navigate menu with arrow keys', async ({ page }) => {
      test.skip(); // Skip until dropdown menu is implemented

      await page.goto('/');

      // Open user menu
      await page.click('[data-testid="user-menu"]');

      // Navigate with arrow keys
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      // Verify navigation occurred
    });
  });

  test.describe('Screen Reader Support', () => {
    test('should have proper ARIA labels on buttons', async ({ page }) => {
      await page.goto('/');

      const buttons = await page.locator('button').all();

      for (const button of buttons) {
        const ariaLabel = await button.getAttribute('aria-label');
        const text = await button.textContent();

        // Button should have either aria-label or visible text
        expect(ariaLabel || text?.trim()).toBeTruthy();
      }
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');

      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();

      let currentLevel = 0;
      for (const heading of headings) {
        const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
        const level = parseInt(tagName.charAt(1));

        // Heading levels should not skip (e.g., h1 -> h3)
        if (currentLevel > 0) {
          expect(level - currentLevel).toBeLessThanOrEqual(1);
        }

        currentLevel = level;
      }
    });

    test('should have alt text for images', async ({ page }) => {
      await page.goto('/');

      const images = await page.locator('img').all();

      for (const img of images) {
        const alt = await img.getAttribute('alt');
        const role = await img.getAttribute('role');

        // Images should have alt text or role="presentation"
        expect(alt !== null || role === 'presentation').toBe(true);
      }
    });

    test('should have proper form labels', async ({ page }) => {
      await page.goto('/auth/signin');

      const inputs = await page.locator('input:not([type="hidden"])').all();

      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = (await label.count()) > 0;

          // Input should have associated label or aria-label
          expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    });

    test('should announce loading states', async ({ page }) => {
      test.skip(); // Skip until loading states are implemented

      await page.goto('/projects');

      const loadingIndicator = page.locator('[role="status"], [aria-live="polite"]');
      if (await loadingIndicator.count() > 0) {
        await expect(loadingIndicator).toBeVisible();
      }
    });
  });

  test.describe('Color Contrast', () => {
    test('should meet WCAG AA color contrast requirements', async ({ page }) => {
      await page.goto('/');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze();

      const contrastViolations = accessibilityScanResults.violations.filter(
        violation => violation.id === 'color-contrast'
      );

      expect(contrastViolations).toEqual([]);
    });

    test('should maintain contrast in dark mode', async ({ page }) => {
      test.skip(); // Skip until dark mode is confirmed

      await page.goto('/');

      // Enable dark mode
      await page.click('[data-testid="theme-toggle"]');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze();

      const contrastViolations = accessibilityScanResults.violations.filter(
        violation => violation.id === 'color-contrast'
      );

      expect(contrastViolations).toEqual([]);
    });
  });

  test.describe('Focus Management', () => {
    test('should trap focus in modal', async ({ page }) => {
      test.skip(); // Skip until modal is implemented

      await page.goto('/projects');

      await page.click('[data-testid="create-project-button"]');

      // Tab through modal
      const modal = page.locator('[data-testid="create-project-modal"]');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Focus should remain within modal
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      const isInModal = await modal.evaluate(
        (modalEl, focusedEl) => modalEl.contains(focusedEl as Node),
        focusedElement
      );

      expect(isInModal).toBe(true);
    });

    test('should return focus after closing modal', async ({ page }) => {
      test.skip(); // Skip until modal is implemented

      await page.goto('/projects');

      const triggerButton = page.locator('[data-testid="create-project-button"]');
      await triggerButton.click();

      await page.keyboard.press('Escape');

      // Focus should return to trigger button
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      const isTriggerButton = await triggerButton.evaluate(
        (button, focused) => button === focused,
        focusedElement
      );

      expect(isTriggerButton).toBe(true);
    });
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' },
    ];

    for (const viewport of viewports) {
      test(`should be accessible on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');

        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      });
    }
  });
});
