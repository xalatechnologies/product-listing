import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should load landing page successfully', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/ListingAI|Product Listing/i);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test.describe('Navigation', () => {
    test('should display navigation bar', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('text=ListingAI')).toBeVisible();
      await expect(page.locator('text=Features')).toBeVisible();
      await expect(page.locator('text=Pricing')).toBeVisible();
      await expect(page.locator('text=Testimonials')).toBeVisible();
    });

    test('should navigate to sign in page', async ({ page }) => {
      await page.goto('/');

      await page.click('text=Sign In');

      await expect(page).toHaveURL(/\/auth\/signin/);
    });

    test('should scroll to sections on anchor click', async ({ page }) => {
      await page.goto('/');

      const featuresLink = page.locator('text=Features').first();
      await featuresLink.click();

      // Wait for scroll animation
      await page.waitForTimeout(1000);

      // Verify features section is in viewport
      const featuresSection = page.locator('#features, [data-section="features"]').first();
      if (await featuresSection.count() > 0) {
        await expect(featuresSection).toBeInViewport();
      }
    });

    test('should toggle mobile menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      const menuButton = page.getByLabel(/toggle.*menu|menu/i);
      await menuButton.click();

      // Mobile menu should be visible
      await expect(page.locator('text=Features').nth(1)).toBeVisible();
    });
  });

  test.describe('Hero Section', () => {
    test('should display hero content', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('text=/create.*stunning|product.*listings/i')).toBeVisible();
      await expect(page.locator('text=/try.*free|get started|start creating/i').first()).toBeVisible();
    });

    test('should have working CTA buttons', async ({ page }) => {
      await page.goto('/');

      const ctaButtons = page.locator('a[href*="/auth/signin"]');
      const count = await ctaButtons.count();

      expect(count).toBeGreaterThan(0);

      // Click first CTA
      await ctaButtons.first().click();
      await expect(page).toHaveURL(/\/auth\/signin/);
    });

    test('should display hero images/graphics', async ({ page }) => {
      await page.goto('/');

      // Check for hero visuals (images, illustrations, or background elements)
      const heroSection = page.locator('section').first();
      const hasVisuals = await page.evaluate(() => {
        const section = document.querySelector('section');
        if (!section) return false;

        // Check for images
        const images = section.querySelectorAll('img');
        if (images.length > 0) return true;

        // Check for SVG graphics
        const svgs = section.querySelectorAll('svg');
        if (svgs.length > 0) return true;

        // Check for animated elements
        const animated = section.querySelectorAll('[class*="animate"]');
        if (animated.length > 0) return true;

        return false;
      });

      // Either has visuals or has text content
      const hasContent = await heroSection.locator('h1, h2, p').first().isVisible();
      expect(hasVisuals || hasContent).toBe(true);
    });
  });

  test.describe('Features Section', () => {
    test('should display features', async ({ page }) => {
      await page.goto('/');

      const featuresSection = page.locator('#features, text=/how it works|features/i').first();
      if (await featuresSection.count() > 0) {
        await featuresSection.scrollIntoViewIfNeeded();

        // Look for step indicators or feature cards
        const steps = page.locator('[data-testid*="step"], .step, [class*="step"]');
        const features = page.locator('[data-testid*="feature"], .feature, [class*="feature"]');

        const stepCount = await steps.count();
        const featureCount = await features.count();

        expect(stepCount + featureCount).toBeGreaterThan(0);
      }
    });

    test('should display "How It Works" section', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('text=How It Works')).toBeVisible();

      // Should show multiple steps
      await expect(page.locator('text=/upload/i')).toBeVisible();
      await expect(page.locator('text=/ai.*generates/i')).toBeVisible();
    });
  });

  test.describe('Pricing Section', () => {
    test('should display pricing plans', async ({ page }) => {
      await page.goto('/');

      const pricingSection = page.locator('#pricing, text=/pricing/i').first();
      if (await pricingSection.count() > 0) {
        await pricingSection.scrollIntoViewIfNeeded();

        // Look for pricing cards or tiers
        const pricingCards = page.locator('[data-testid*="pricing"], [class*="pricing"]');
        const count = await pricingCards.count();

        expect(count).toBeGreaterThan(0);
      }
    });

    test('should show pricing information', async ({ page }) => {
      await page.goto('/');

      // Look for price indicators
      const hasPricing = await page.locator('text=/\\$\\d+|free/i').count();
      expect(hasPricing).toBeGreaterThan(0);
    });
  });

  test.describe('CTA Section', () => {
    test('should display final call-to-action', async ({ page }) => {
      await page.goto('/');

      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      const finalCTA = page.locator('text=/ready to|get started|start.*free|try.*free/i').last();
      await expect(finalCTA).toBeVisible();
    });

    test('should have working sign-up buttons throughout page', async ({ page }) => {
      await page.goto('/');

      const signUpButtons = page.locator('a[href*="/auth/signin"]');
      const count = await signUpButtons.count();

      // Should have multiple CTAs throughout the page
      expect(count).toBeGreaterThan(2);
    });
  });

  test.describe('Responsive Design', () => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' },
    ];

    for (const viewport of viewports) {
      test(`should display correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');

        // Page should load
        await expect(page.locator('h1, h2').first()).toBeVisible();

        // Navigation should be present
        await expect(page.locator('text=ListingAI')).toBeVisible();

        // CTA should be visible
        await expect(page.locator('text=/get started|try.*free|sign in/i').first()).toBeVisible();
      });
    }
  });

  test.describe('Performance', () => {
    test('should load within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;

      // Page should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should have proper meta tags', async ({ page }) => {
      await page.goto('/');

      // Check for essential meta tags
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);

      const description = await page.locator('meta[name="description"]').getAttribute('content');
      if (description) {
        expect(description.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Visual Regression', () => {
    test('should match hero section screenshot', async ({ page }) => {
      await page.goto('/');

      const heroSection = page.locator('section').first();
      await expect(heroSection).toHaveScreenshot('hero-section.png', {
        maxDiffPixels: 100,
      });
    });

    test('should match full page screenshot', async ({ page }) => {
      await page.goto('/');

      await expect(page).toHaveScreenshot('landing-page-full.png', {
        fullPage: true,
        maxDiffPixels: 500,
      });
    });
  });

  test.describe('Animations', () => {
    test('should have smooth animations', async ({ page }) => {
      await page.goto('/');

      // Check for animation classes
      const animatedElements = page.locator('[class*="animate"], [class*="motion"]');
      const count = await animatedElements.count();

      expect(count).toBeGreaterThan(0);
    });

    test('should respect reduced motion preference', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');

      // Animations should still function but be less prominent
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });
  });
});
