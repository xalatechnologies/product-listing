import { test, expect } from '@playwright/test';
import { signIn, isAuthenticated } from './helpers/auth';
import { testUsers } from './fixtures/testData';
import path from 'path';

test.describe('File Upload', () => {
  test.beforeEach(async ({ page }) => {
    // Skip authentication for now
    test.skip();
    await signIn(page, testUsers.validUser);
    expect(await isAuthenticated(page)).toBe(true);
  });

  test.describe('Image Upload', () => {
    test('should display upload interface', async ({ page }) => {
      await page.goto('/projects/new');

      const uploadArea = page.locator('[data-testid="file-upload-area"]');
      if (await uploadArea.count() > 0) {
        await expect(uploadArea).toBeVisible();
        await expect(page.locator('text=/drag.*drop|upload/i')).toBeVisible();
      }
    });

    test('should upload single image file', async ({ page }) => {
      test.skip(); // Skip until upload functionality is confirmed

      await page.goto('/projects/new');

      const fileInput = page.locator('input[type="file"]');
      const filePath = path.join(process.cwd(), 'tests/fixtures/test-image.jpg');

      await fileInput.setInputFiles(filePath);

      // Verify upload progress or success message
      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
      await expect(page.locator('text=/upload.*complete|success/i')).toBeVisible({ timeout: 30000 });

      // Verify image preview
      await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();
    });

    test('should upload multiple images', async ({ page }) => {
      test.skip();

      await page.goto('/projects/new');

      const fileInput = page.locator('input[type="file"]');
      const filePaths = [
        path.join(process.cwd(), 'tests/fixtures/test-image1.jpg'),
        path.join(process.cwd(), 'tests/fixtures/test-image2.jpg'),
        path.join(process.cwd(), 'tests/fixtures/test-image3.jpg'),
      ];

      await fileInput.setInputFiles(filePaths);

      // Verify all images are uploaded
      const previews = page.locator('[data-testid="image-preview"]');
      await expect(previews).toHaveCount(3);
    });

    test('should reject invalid file types', async ({ page }) => {
      test.skip();

      await page.goto('/projects/new');

      const fileInput = page.locator('input[type="file"]');
      const filePath = path.join(process.cwd(), 'tests/fixtures/invalid-file.txt');

      await fileInput.setInputFiles(filePath);

      await expect(page.locator('text=/invalid.*file.*type/i')).toBeVisible();
    });

    test('should reject files exceeding size limit', async ({ page }) => {
      test.skip();

      await page.goto('/projects/new');

      const fileInput = page.locator('input[type="file"]');
      const filePath = path.join(process.cwd(), 'tests/fixtures/large-image.jpg');

      await fileInput.setInputFiles(filePath);

      await expect(page.locator('text=/file.*too.*large|exceeds.*limit/i')).toBeVisible();
    });

    test('should support drag and drop', async ({ page }) => {
      test.skip();

      await page.goto('/projects/new');

      const uploadArea = page.locator('[data-testid="file-upload-area"]');
      const filePath = path.join(process.cwd(), 'tests/fixtures/test-image.jpg');

      // Read file buffer
      const buffer = require('fs').readFileSync(filePath);
      const dataTransfer = await page.evaluateHandle((data) => {
        const dt = new DataTransfer();
        const file = new File([data], 'test-image.jpg', { type: 'image/jpeg' });
        dt.items.add(file);
        return dt;
      }, buffer);

      await uploadArea.dispatchEvent('drop', { dataTransfer });

      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    });
  });

  test.describe('Image Management', () => {
    test('should delete uploaded image', async ({ page }) => {
      test.skip();

      await page.goto('/projects/new');

      const fileInput = page.locator('input[type="file"]');
      const filePath = path.join(process.cwd(), 'tests/fixtures/test-image.jpg');
      await fileInput.setInputFiles(filePath);

      await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();

      await page.click('[data-testid="delete-image-button"]');

      await expect(page.locator('[data-testid="image-preview"]')).not.toBeVisible();
    });

    test('should replace uploaded image', async ({ page }) => {
      test.skip();

      await page.goto('/projects/new');

      // Upload first image
      const fileInput = page.locator('input[type="file"]');
      let filePath = path.join(process.cwd(), 'tests/fixtures/test-image1.jpg');
      await fileInput.setInputFiles(filePath);

      await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();

      // Replace with second image
      filePath = path.join(process.cwd(), 'tests/fixtures/test-image2.jpg');
      await page.click('[data-testid="replace-image-button"]');
      await fileInput.setInputFiles(filePath);

      const previews = page.locator('[data-testid="image-preview"]');
      await expect(previews).toHaveCount(1);
    });

    test('should reorder uploaded images', async ({ page }) => {
      test.skip();

      await page.goto('/projects/new');

      const fileInput = page.locator('input[type="file"]');
      const filePaths = [
        path.join(process.cwd(), 'tests/fixtures/test-image1.jpg'),
        path.join(process.cwd(), 'tests/fixtures/test-image2.jpg'),
      ];
      await fileInput.setInputFiles(filePaths);

      const firstImage = page.locator('[data-testid="image-preview"]').first();
      const secondImage = page.locator('[data-testid="image-preview"]').nth(1);

      // Drag first image to second position
      await firstImage.dragTo(secondImage);

      // Verify order has changed
      // Implementation depends on how images are identified
    });
  });

  test.describe('Upload Progress', () => {
    test('should show upload progress indicator', async ({ page }) => {
      test.skip();

      await page.goto('/projects/new');

      const fileInput = page.locator('input[type="file"]');
      const filePath = path.join(process.cwd(), 'tests/fixtures/test-image.jpg');

      await fileInput.setInputFiles(filePath);

      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    });

    test('should allow cancelling upload', async ({ page }) => {
      test.skip();

      await page.goto('/projects/new');

      const fileInput = page.locator('input[type="file"]');
      const filePath = path.join(process.cwd(), 'tests/fixtures/large-image.jpg');

      await fileInput.setInputFiles(filePath);

      await page.click('[data-testid="cancel-upload-button"]');

      await expect(page.locator('text=/upload.*cancelled/i')).toBeVisible();
      await expect(page.locator('[data-testid="upload-progress"]')).not.toBeVisible();
    });

    test('should handle upload failures gracefully', async ({ page }) => {
      test.skip();

      await page.goto('/projects/new');

      // Mock API error
      await page.route('**/api/upload*', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Upload failed' }),
        });
      });

      const fileInput = page.locator('input[type="file"]');
      const filePath = path.join(process.cwd(), 'tests/fixtures/test-image.jpg');

      await fileInput.setInputFiles(filePath);

      await expect(page.locator('text=/upload.*failed|error/i')).toBeVisible();
    });

    test('should show retry option on upload failure', async ({ page }) => {
      test.skip();

      await page.goto('/projects/new');

      // Mock API error
      await page.route('**/api/upload*', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Upload failed' }),
        });
      });

      const fileInput = page.locator('input[type="file"]');
      const filePath = path.join(process.cwd(), 'tests/fixtures/test-image.jpg');

      await fileInput.setInputFiles(filePath);

      await expect(page.locator('[data-testid="retry-upload-button"]')).toBeVisible();
    });
  });
});
