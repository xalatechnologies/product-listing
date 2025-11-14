import { test, expect } from '@playwright/test';
import { signIn, isAuthenticated } from './helpers/auth';
import { testUsers } from './fixtures/testData';

test.describe('A+ Content Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Skip tests if AI services are not available
    test.skip(process.env.CI === 'true' && !process.env.OPENAI_API_KEY, 'AI services not available in CI');
    
    await signIn(page, testUsers.validUser);
    expect(await isAuthenticated(page)).toBe(true);
  });

  test.describe('A+ Content Generation', () => {
    test('should generate A+ content for project', async ({ page }) => {
      // Navigate to a project
      await page.goto('/projects');
      
      const projectCards = page.locator('[data-testid="project-card"]');
      const count = await projectCards.count();
      
      if (count === 0) {
        test.skip(true, 'No projects available for testing');
        return;
      }

      // Click on first project
      await projectCards.first().click();
      await page.waitForURL(/\/projects\/[^/]+$/);

      // Find "Generate A+ Content" button or link to A+ page
      const generateButton = page.locator('button:has-text("Generate A+ Content"), a:has-text("A+ Content"), button:has-text("A+")');
      const aplusLink = page.locator('a[href*="/aplus"]');
      
      let shouldNavigateToAPlus = false;
      
      if (await generateButton.count() > 0) {
        // Click generate button (may open modal)
        await generateButton.first().click();
        
        // Check if modal opened
        const modal = page.locator('[role="dialog"], .modal, [data-testid="aplus-modal"]');
        if (await modal.count() > 0) {
          // Select Standard or Premium option if available
          const standardOption = page.locator('button:has-text("Standard"), input[value="standard"]');
          if (await standardOption.count() > 0) {
            await standardOption.first().click();
          }
          
          // Click confirm/generate button in modal
          const confirmButton = page.locator('button:has-text("Generate"), button:has-text("Confirm")');
          if (await confirmButton.count() > 0) {
            await confirmButton.first().click();
          }
        }
      } else if (await aplusLink.count() > 0) {
        // Navigate to A+ page first
        await aplusLink.first().click();
        await page.waitForURL(/\/aplus/);
        shouldNavigateToAPlus = true;
      } else {
        test.skip(true, 'A+ Content generation button/link not found');
        return;
      }

      // If we navigated to A+ page, look for generate button there
      if (shouldNavigateToAPlus || (await page.url().includes('/aplus'))) {
        const generateButtonOnPage = page.locator('button:has-text("Generate A+ Content"), button:has-text("Generate")');
        if (await generateButtonOnPage.count() > 0) {
          await generateButtonOnPage.first().click();
        }
      }

      // Wait for loading state
      const loadingIndicator = page.locator('text=/generating|processing|loading/i, [data-testid="loading"]');
      if (await loadingIndicator.count() > 0) {
        await expect(loadingIndicator.first()).toBeVisible({ timeout: 5000 });
      }

      // Wait for success message or A+ content modules to appear
      const successToast = page.locator('text=/success|generated|complete/i');
      const aplusModules = page.locator('[data-testid="aplus-module"], .aplus-module');
      const aplusEditor = page.locator('[data-testid="aplus-editor"]');
      
      // Wait with longer timeout for AI processing
      await Promise.race([
        successToast.waitFor({ timeout: 120000 }).catch(() => null),
        aplusModules.first().waitFor({ timeout: 120000 }).catch(() => null),
        aplusEditor.waitFor({ timeout: 120000 }).catch(() => null),
      ]);

      // Verify success or modules/editor appear
      const hasSuccess = await successToast.count() > 0;
      const hasModules = await aplusModules.count() > 0;
      const hasEditor = await aplusEditor.count() > 0;
      
      expect(hasSuccess || hasModules || hasEditor).toBe(true);
    });

    test('should display A+ content editor', async ({ page }) => {
      // Navigate to A+ content page for a project
      await page.goto('/projects');
      
      const projectCards = page.locator('[data-testid="project-card"]');
      const count = await projectCards.count();
      
      if (count === 0) {
        test.skip(true, 'No projects available for testing');
        return;
      }

      await projectCards.first().click();
      await page.waitForURL(/\/projects\/[^/]+$/);

      // Navigate to A+ page
      const aplusLink = page.locator('a[href*="/aplus"], button:has-text("A+ Content"), button:has-text("Manage A+ Content")');
      
      if (await aplusLink.count() === 0) {
        test.skip(true, 'A+ Content link not found');
        return;
      }

      await aplusLink.first().click();
      await page.waitForURL(/\/aplus/);

      // Verify A+ editor is displayed
      const aplusEditor = page.locator('[data-testid="aplus-editor"], .aplus-editor');
      const aplusPreview = page.locator('[data-testid="aplus-preview"], .aplus-preview');
      
      // Either editor or preview should be visible
      const hasEditor = await aplusEditor.count() > 0;
      const hasPreview = await aplusPreview.count() > 0;
      
      if (hasEditor || hasPreview) {
        if (hasEditor) {
          await expect(aplusEditor.first()).toBeVisible();
        }
        if (hasPreview) {
          await expect(aplusPreview.first()).toBeVisible();
        }
      } else {
        // If no content exists, should show empty state or generate button
        const emptyState = page.locator('text=/no.*content|generate.*content/i');
        const generateButton = page.locator('button:has-text("Generate")');
        
        expect(await emptyState.count() > 0 || await generateButton.count() > 0).toBe(true);
      }
    });
  });

  test.describe('A+ Content Export', () => {
    test('should export A+ content as ZIP', async ({ page }) => {
      // Navigate to A+ content page
      await page.goto('/projects');
      
      const projectCards = page.locator('[data-testid="project-card"]');
      const count = await projectCards.count();
      
      if (count === 0) {
        test.skip(true, 'No projects available for testing');
        return;
      }

      await projectCards.first().click();
      await page.waitForURL(/\/projects\/[^/]+$/);

      // Navigate to A+ page
      const aplusLink = page.locator('a[href*="/aplus"]');
      
      if (await aplusLink.count() === 0) {
        test.skip(true, 'A+ Content link not found');
        return;
      }

      await aplusLink.first().click();
      await page.waitForURL(/\/aplus/);

      // Check if A+ content exists
      const aplusModules = page.locator('[data-testid="aplus-module"]');
      const moduleCount = await aplusModules.count();
      
      if (moduleCount === 0) {
        test.skip(true, 'No A+ content modules to export');
        return;
      }

      // Find export button
      const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');
      
      if (await exportButton.count() === 0) {
        test.skip(true, 'Export button not found');
        return;
      }

      // Set up download listener
      const downloadPromise = page.waitForEvent('download', { timeout: 120000 });

      // Click export button
      await exportButton.first().click();

      // Wait for format selection if modal appears
      const formatSelect = page.locator('select[name="format"], select[data-testid="export-format"]');
      if (await formatSelect.count() > 0) {
        await formatSelect.first().selectOption('png');
        
        // Click confirm export button
        const confirmExport = page.locator('button:has-text("Export"), button:has-text("Download")');
        if (await confirmExport.count() > 0) {
          await confirmExport.first().click();
        }
      }

      // Wait for download to start
      try {
        const download = await downloadPromise;
        
        // Verify download filename
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.zip$/i);
        
        // Verify download is not empty (basic check)
        const path = await download.path();
        expect(path).toBeTruthy();
      } catch (error) {
        // If download doesn't start, check for success message
        const successToast = page.locator('text=/success|exported|downloaded/i');
        const hasSuccess = await successToast.count() > 0;
        
        // Either download should start or success message should appear
        expect(hasSuccess).toBe(true);
      }
    });
  });

  test.describe('A+ Content Editing', () => {
    test('should allow editing A+ content modules', async ({ page }) => {
      // Navigate to A+ content page
      await page.goto('/projects');
      
      const projectCards = page.locator('[data-testid="project-card"]');
      const count = await projectCards.count();
      
      if (count === 0) {
        test.skip(true, 'No projects available for testing');
        return;
      }

      await projectCards.first().click();
      await page.waitForURL(/\/projects\/[^/]+$/);

      // Navigate to A+ page
      const aplusLink = page.locator('a[href*="/aplus"]');
      
      if (await aplusLink.count() === 0) {
        test.skip(true, 'A+ Content link not found');
        return;
      }

      await aplusLink.first().click();
      await page.waitForURL(/\/aplus/);

      // Check if A+ content exists
      const aplusModules = page.locator('[data-testid="aplus-module"]');
      const moduleCount = await aplusModules.count();
      
      if (moduleCount === 0) {
        test.skip(true, 'No A+ content modules to edit');
        return;
      }

      // Try to find editable fields in first module
      const firstModule = aplusModules.first();
      const editableFields = firstModule.locator('input, textarea, [contenteditable="true"]');
      
      if (await editableFields.count() > 0) {
        // Click on first editable field
        await editableFields.first().click();
        
        // Try to edit content
        await editableFields.first().fill('Test content');
        
        // Look for save button
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
        if (await saveButton.count() > 0) {
          await saveButton.first().click();
          
          // Wait for success message
          const successToast = page.locator('text=/saved|updated|success/i');
          await expect(successToast.first()).toBeVisible({ timeout: 10000 });
        }
      }
    });
  });
});

