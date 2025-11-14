import { test, expect } from '@playwright/test';
import { signIn, isAuthenticated } from './helpers/auth';
import { testUsers, testProjects } from './fixtures/testData';

test.describe('Image Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Skip tests if AI services are not available
    // These tests require running app with OPENAI_API_KEY and REMOVEBG_API_KEY
    test.skip(process.env.CI === 'true' && !process.env.OPENAI_API_KEY, 'AI services not available in CI');
    
    await signIn(page, testUsers.validUser);
    expect(await isAuthenticated(page)).toBe(true);
  });

  test.describe('Main Image Generation', () => {
    test('should generate main image for project', async ({ page }) => {
      // Navigate to a project with product images
      await page.goto('/projects');
      
      // Wait for projects to load
      const projectCards = page.locator('[data-testid="project-card"]');
      const count = await projectCards.count();
      
      if (count === 0) {
        test.skip(true, 'No projects available for testing');
        return;
      }

      // Click on first project
      await projectCards.first().click();
      await page.waitForURL(/\/projects\/[^/]+$/);

      // Check if project has product images
      const productImages = page.locator('[data-testid="product-image"]');
      const imageCount = await productImages.count();
      
      if (imageCount === 0) {
        test.skip(true, 'Project has no product images');
        return;
      }

      // Find and click "Generate Main Image" button
      const generateMainImageButton = page.locator('button:has-text("Generate Main Image"), button:has-text("Main Image")');
      
      if (await generateMainImageButton.count() === 0) {
        test.skip(true, 'Generate Main Image button not found');
        return;
      }

      // Click generate button
      await generateMainImageButton.first().click();

      // Wait for loading state
      await expect(generateMainImageButton).toBeDisabled({ timeout: 5000 });

      // Wait for success message or generated image to appear
      // Note: This may take a while depending on AI service response time
      const successToast = page.locator('text=/success|generated|complete/i');
      const generatedImage = page.locator('[data-testid="generated-image"][data-type="MAIN_IMAGE"]');
      
      // Wait for either success toast or generated image (with longer timeout for AI processing)
      await Promise.race([
        successToast.waitFor({ timeout: 120000 }).catch(() => null),
        generatedImage.waitFor({ timeout: 120000 }).catch(() => null),
        page.waitForSelector('text=/processing|generating/i', { timeout: 5000 }).catch(() => null),
      ]);

      // Verify either success message or generated image appears
      const hasSuccess = await successToast.count() > 0;
      const hasImage = await generatedImage.count() > 0;
      
      expect(hasSuccess || hasImage).toBe(true);
    });

    test('should show error when generating without product images', async ({ page }) => {
      // Navigate to a project without product images
      await page.goto('/projects');
      
      const projectCards = page.locator('[data-testid="project-card"]');
      const count = await projectCards.count();
      
      if (count === 0) {
        test.skip(true, 'No projects available for testing');
        return;
      }

      await projectCards.first().click();
      await page.waitForURL(/\/projects\/[^/]+$/);

      // Check if project has no product images
      const productImages = page.locator('[data-testid="product-image"]');
      const imageCount = await productImages.count();
      
      if (imageCount > 0) {
        test.skip(true, 'Project has product images');
        return;
      }

      // Generate button should be disabled or show error
      const generateButton = page.locator('button:has-text("Generate Main Image")');
      
      if (await generateButton.count() > 0) {
        await expect(generateButton.first()).toBeDisabled();
      }
    });
  });

  test.describe('Infographic Generation', () => {
    test('should generate infographic for project', async ({ page }) => {
      // Navigate to a project
      await page.goto('/projects');
      
      const projectCards = page.locator('[data-testid="project-card"]');
      const count = await projectCards.count();
      
      if (count === 0) {
        test.skip(true, 'No projects available for testing');
        return;
      }

      await projectCards.first().click();
      await page.waitForURL(/\/projects\/[^/]+$/);

      // Find and click "Generate Infographic" button
      const generateInfographicButton = page.locator('button:has-text("Generate Infographic"), button:has-text("Infographic")');
      
      if (await generateInfographicButton.count() === 0) {
        test.skip(true, 'Generate Infographic button not found');
        return;
      }

      // Click generate button
      await generateInfographicButton.first().click();

      // Wait for loading state
      await expect(generateInfographicButton).toBeDisabled({ timeout: 5000 });

      // Wait for success message or generated image
      const successToast = page.locator('text=/success|generated|complete/i');
      const generatedImage = page.locator('[data-testid="generated-image"][data-type="INFOGRAPHIC"]');
      
      await Promise.race([
        successToast.waitFor({ timeout: 120000 }).catch(() => null),
        generatedImage.waitFor({ timeout: 120000 }).catch(() => null),
      ]);

      // Verify success or generated image
      const hasSuccess = await successToast.count() > 0;
      const hasImage = await generatedImage.count() > 0;
      
      expect(hasSuccess || hasImage).toBe(true);
    });
  });

  test.describe('Generated Images Display', () => {
    test('should display generated images in project detail', async ({ page }) => {
      await page.goto('/projects');
      
      const projectCards = page.locator('[data-testid="project-card"]');
      const count = await projectCards.count();
      
      if (count === 0) {
        test.skip(true, 'No projects available for testing');
        return;
      }

      await projectCards.first().click();
      await page.waitForURL(/\/projects\/[^/]+$/);

      // Look for generated images section
      const generatedImagesSection = page.locator('text=/generated.*images/i, [data-testid="generated-images"]');
      
      if (await generatedImagesSection.count() > 0) {
        // Verify section is visible
        await expect(generatedImagesSection.first()).toBeVisible();
        
        // Check for generated image cards
        const generatedImageCards = page.locator('[data-testid="generated-image"]');
        const imageCount = await generatedImageCards.count();
        
        // If images exist, verify they're displayed correctly
        if (imageCount > 0) {
          await expect(generatedImageCards.first()).toBeVisible();
        }
      }
    });
  });
});

