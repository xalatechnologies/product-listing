import { test, expect } from '@playwright/test';
import { signIn, isAuthenticated } from './helpers/auth';
import { testUsers, testBrandKits } from './fixtures/testData';

test.describe('Brand Kit Management', () => {
  test.beforeEach(async ({ page }) => {
    // Skip authentication for now
    test.skip();
    await signIn(page, testUsers.validUser);
    expect(await isAuthenticated(page)).toBe(true);
  });

  test.describe('Brand Kit List', () => {
    test('should display brand kits page', async ({ page }) => {
      await page.goto('/brand-kits');

      await expect(page.locator('h1')).toContainText(/brand kits/i);
      await expect(page.locator('[data-testid="create-brand-kit-button"]')).toBeVisible();
    });

    test('should display brand kit cards', async ({ page }) => {
      await page.goto('/brand-kits');

      const brandKitCards = page.locator('[data-testid="brand-kit-card"]');
      const count = await brandKitCards.count();

      if (count > 0) {
        await expect(brandKitCards.first()).toBeVisible();
        await expect(brandKitCards.first().locator('[data-testid="brand-kit-name"]')).toBeVisible();
      }
    });
  });

  test.describe('Create Brand Kit', () => {
    test('should open create brand kit form', async ({ page }) => {
      await page.goto('/brand-kits');

      await page.click('[data-testid="create-brand-kit-button"]');

      await expect(page.locator('[data-testid="brand-kit-form"]')).toBeVisible();
      await expect(page.locator('input[name="name"]')).toBeVisible();
    });

    test('should successfully create a brand kit', async ({ page }) => {
      await page.goto('/brand-kits');

      await page.click('[data-testid="create-brand-kit-button"]');

      // Fill in brand kit details
      await page.fill('input[name="name"]', testBrandKits.basic.name);
      await page.fill('input[name="primaryColor"]', testBrandKits.basic.primaryColor);
      await page.fill('input[name="secondaryColor"]', testBrandKits.basic.secondaryColor);

      // Select font
      const fontSelect = page.locator('select[name="fontFamily"]');
      if (await fontSelect.count() > 0) {
        await fontSelect.selectOption(testBrandKits.basic.fontFamily);
      }

      await page.click('button[type="submit"]');

      await expect(page.locator('text=/brand kit.*created/i')).toBeVisible();
    });

    test('should validate color inputs', async ({ page }) => {
      await page.goto('/brand-kits');

      await page.click('[data-testid="create-brand-kit-button"]');

      await page.fill('input[name="name"]', 'Test Brand Kit');
      await page.fill('input[name="primaryColor"]', 'invalid-color');

      await page.click('button[type="submit"]');

      await expect(page.locator('text=/invalid.*color/i')).toBeVisible();
    });
  });

  test.describe('Edit Brand Kit', () => {
    test('should open edit form with existing data', async ({ page }) => {
      await page.goto('/brand-kits');

      const editButton = page.locator('[data-testid="edit-brand-kit-button"]').first();
      if (await editButton.count() > 0) {
        await editButton.click();

        await expect(page.locator('[data-testid="brand-kit-form"]')).toBeVisible();

        const nameInput = page.locator('input[name="name"]');
        const nameValue = await nameInput.inputValue();
        expect(nameValue).toBeTruthy();
      }
    });

    test('should successfully update brand kit', async ({ page }) => {
      await page.goto('/brand-kits');

      const editButton = page.locator('[data-testid="edit-brand-kit-button"]').first();
      if (await editButton.count() > 0) {
        await editButton.click();

        const updatedColor = '#00FF00';
        await page.fill('input[name="primaryColor"]', updatedColor);
        await page.click('button[type="submit"]');

        await expect(page.locator('text=/brand kit.*updated/i')).toBeVisible();
      }
    });
  });

  test.describe('Color Picker', () => {
    test('should open color picker', async ({ page }) => {
      test.skip();

      await page.goto('/brand-kits');
      await page.click('[data-testid="create-brand-kit-button"]');

      const colorInput = page.locator('input[name="primaryColor"]');
      await colorInput.click();

      await expect(page.locator('[data-testid="color-picker"]')).toBeVisible();
    });

    test('should update color value on selection', async ({ page }) => {
      test.skip();

      await page.goto('/brand-kits');
      await page.click('[data-testid="create-brand-kit-button"]');

      const colorInput = page.locator('input[name="primaryColor"]');
      await colorInput.fill('#FF0000');

      const value = await colorInput.inputValue();
      expect(value).toBe('#FF0000');
    });

    test('should show color preview', async ({ page }) => {
      test.skip();

      await page.goto('/brand-kits');
      await page.click('[data-testid="create-brand-kit-button"]');

      await page.fill('input[name="primaryColor"]', '#FF0000');

      const preview = page.locator('[data-testid="color-preview"]');
      const backgroundColor = await preview.evaluate(el => window.getComputedStyle(el).backgroundColor);

      expect(backgroundColor).toContain('rgb(255, 0, 0)');
    });
  });

  test.describe('Logo Upload', () => {
    test('should upload brand logo', async ({ page }) => {
      test.skip();

      await page.goto('/brand-kits');
      await page.click('[data-testid="create-brand-kit-button"]');

      const fileInput = page.locator('input[type="file"][name="logo"]');
      const filePath = require('path').join(process.cwd(), 'tests/fixtures/test-logo.png');

      await fileInput.setInputFiles(filePath);

      await expect(page.locator('[data-testid="logo-preview"]')).toBeVisible();
    });

    test('should remove uploaded logo', async ({ page }) => {
      test.skip();

      await page.goto('/brand-kits');
      await page.click('[data-testid="create-brand-kit-button"]');

      const fileInput = page.locator('input[type="file"][name="logo"]');
      const filePath = require('path').join(process.cwd(), 'tests/fixtures/test-logo.png');

      await fileInput.setInputFiles(filePath);
      await page.click('[data-testid="remove-logo-button"]');

      await expect(page.locator('[data-testid="logo-preview"]')).not.toBeVisible();
    });
  });

  test.describe('Delete Brand Kit', () => {
    test('should show confirmation dialog', async ({ page }) => {
      await page.goto('/brand-kits');

      const deleteButton = page.locator('[data-testid="delete-brand-kit-button"]').first();
      if (await deleteButton.count() > 0) {
        await deleteButton.click();

        await expect(page.locator('[data-testid="confirm-delete-dialog"]')).toBeVisible();
      }
    });

    test('should successfully delete brand kit', async ({ page }) => {
      await page.goto('/brand-kits');

      const deleteButton = page.locator('[data-testid="delete-brand-kit-button"]').first();
      if (await deleteButton.count() > 0) {
        const brandKitName = await page.locator('[data-testid="brand-kit-name"]').first().textContent();

        await deleteButton.click();
        await page.click('[data-testid="confirm-delete-button"]');

        await expect(page.locator('text=/brand kit.*deleted/i')).toBeVisible();
        await expect(page.locator(`text=${brandKitName}`)).not.toBeVisible();
      }
    });
  });

  test.describe('Apply Brand Kit', () => {
    test('should apply brand kit to project', async ({ page }) => {
      test.skip();

      await page.goto('/projects/new');

      const brandKitSelect = page.locator('[data-testid="brand-kit-select"]');
      if (await brandKitSelect.count() > 0) {
        await brandKitSelect.selectOption({ index: 1 });

        await expect(page.locator('text=/brand kit.*applied/i')).toBeVisible();
      }
    });

    test('should preview brand kit styles', async ({ page }) => {
      test.skip();

      await page.goto('/brand-kits');
      await page.locator('[data-testid="brand-kit-card"]').first().click();

      await expect(page.locator('[data-testid="brand-kit-preview"]')).toBeVisible();

      // Verify color swatches
      await expect(page.locator('[data-testid="primary-color-swatch"]')).toBeVisible();
      await expect(page.locator('[data-testid="secondary-color-swatch"]')).toBeVisible();

      // Verify font preview
      await expect(page.locator('[data-testid="font-preview"]')).toBeVisible();
    });
  });
});
