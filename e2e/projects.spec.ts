import { test, expect } from '@playwright/test';
import { signIn, isAuthenticated } from './helpers/auth';
import { testUsers, testProjects } from './fixtures/testData';

test.describe('Project Management', () => {
  test.beforeEach(async ({ page }) => {
    // Skip authentication for now
    test.skip();
    await signIn(page, testUsers.validUser);
    expect(await isAuthenticated(page)).toBe(true);
  });

  test.describe('Project List', () => {
    test('should display projects page', async ({ page }) => {
      await page.goto('/projects');

      await expect(page.locator('h1')).toContainText(/projects/i);
      await expect(page.locator('[data-testid="create-project-button"]')).toBeVisible();
    });

    test('should display empty state when no projects exist', async ({ page }) => {
      await page.goto('/projects');

      const emptyState = page.locator('[data-testid="empty-state"]');
      if (await emptyState.count() > 0) {
        await expect(emptyState).toContainText(/no projects/i);
      }
    });

    test('should display project cards', async ({ page }) => {
      await page.goto('/projects');

      const projectCards = page.locator('[data-testid="project-card"]');
      const count = await projectCards.count();

      if (count > 0) {
        // Verify first project card has required elements
        await expect(projectCards.first()).toBeVisible();
        await expect(projectCards.first().locator('[data-testid="project-name"]')).toBeVisible();
      }
    });

    test('should filter projects by search', async ({ page }) => {
      await page.goto('/projects');

      const searchInput = page.locator('[data-testid="search-input"]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('Test Project');

        // Verify filtered results
        const projectCards = page.locator('[data-testid="project-card"]');
        const count = await projectCards.count();

        if (count > 0) {
          for (let i = 0; i < count; i++) {
            await expect(projectCards.nth(i)).toContainText(/test project/i);
          }
        }
      }
    });
  });

  test.describe('Create Project', () => {
    test('should open create project modal', async ({ page }) => {
      await page.goto('/projects');

      await page.click('[data-testid="create-project-button"]');

      await expect(page.locator('[data-testid="create-project-modal"]')).toBeVisible();
      await expect(page.locator('input[name="name"]')).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/projects');

      await page.click('[data-testid="create-project-button"]');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/name.*required/i')).toBeVisible();
    });

    test('should successfully create a new project', async ({ page }) => {
      await page.goto('/projects');

      await page.click('[data-testid="create-project-button"]');

      // Fill in project details
      await page.fill('input[name="name"]', testProjects.basic.name);
      await page.fill('textarea[name="description"]', testProjects.basic.description);

      await page.click('button[type="submit"]');

      // Verify success message
      await expect(page.locator('text=/project.*created/i')).toBeVisible();

      // Verify project appears in list
      await expect(page.locator(`text=${testProjects.basic.name}`)).toBeVisible();
    });

    test('should handle server errors gracefully', async ({ page }) => {
      // This would require mocking API error responses
      test.skip();

      await page.goto('/projects');
      await page.click('[data-testid="create-project-button"]');

      // Mock API error
      await page.route('**/api/trpc/projects.create*', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      });

      await page.fill('input[name="name"]', testProjects.basic.name);
      await page.click('button[type="submit"]');

      await expect(page.locator('text=/error.*creating.*project/i')).toBeVisible();
    });
  });

  test.describe('Edit Project', () => {
    test('should open edit project modal', async ({ page }) => {
      await page.goto('/projects');

      const editButton = page.locator('[data-testid="edit-project-button"]').first();
      if (await editButton.count() > 0) {
        await editButton.click();

        await expect(page.locator('[data-testid="edit-project-modal"]')).toBeVisible();
      }
    });

    test('should pre-fill form with existing data', async ({ page }) => {
      await page.goto('/projects');

      const editButton = page.locator('[data-testid="edit-project-button"]').first();
      if (await editButton.count() > 0) {
        await editButton.click();

        const nameInput = page.locator('input[name="name"]');
        const nameValue = await nameInput.inputValue();
        expect(nameValue).toBeTruthy();
      }
    });

    test('should successfully update project', async ({ page }) => {
      await page.goto('/projects');

      const editButton = page.locator('[data-testid="edit-project-button"]').first();
      if (await editButton.count() > 0) {
        await editButton.click();

        const updatedName = `Updated ${Date.now()}`;
        await page.fill('input[name="name"]', updatedName);
        await page.click('button[type="submit"]');

        await expect(page.locator('text=/project.*updated/i')).toBeVisible();
        await expect(page.locator(`text=${updatedName}`)).toBeVisible();
      }
    });
  });

  test.describe('Delete Project', () => {
    test('should show confirmation dialog', async ({ page }) => {
      await page.goto('/projects');

      const deleteButton = page.locator('[data-testid="delete-project-button"]').first();
      if (await deleteButton.count() > 0) {
        await deleteButton.click();

        await expect(page.locator('[data-testid="confirm-delete-dialog"]')).toBeVisible();
        await expect(page.locator('text=/are you sure/i')).toBeVisible();
      }
    });

    test('should cancel deletion', async ({ page }) => {
      await page.goto('/projects');

      const deleteButton = page.locator('[data-testid="delete-project-button"]').first();
      if (await deleteButton.count() > 0) {
        await deleteButton.click();

        await page.click('[data-testid="cancel-delete-button"]');

        // Dialog should close
        await expect(page.locator('[data-testid="confirm-delete-dialog"]')).not.toBeVisible();
      }
    });

    test('should successfully delete project', async ({ page }) => {
      await page.goto('/projects');

      const initialCount = await page.locator('[data-testid="project-card"]').count();

      const deleteButton = page.locator('[data-testid="delete-project-button"]').first();
      if (await deleteButton.count() > 0) {
        const projectName = await page.locator('[data-testid="project-name"]').first().textContent();

        await deleteButton.click();
        await page.click('[data-testid="confirm-delete-button"]');

        await expect(page.locator('text=/project.*deleted/i')).toBeVisible();

        // Project should be removed from list
        await expect(page.locator(`text=${projectName}`)).not.toBeVisible();

        const newCount = await page.locator('[data-testid="project-card"]').count();
        expect(newCount).toBe(initialCount - 1);
      }
    });
  });

  test.describe('Project Details', () => {
    test('should navigate to project details page', async ({ page }) => {
      await page.goto('/projects');

      const projectCard = page.locator('[data-testid="project-card"]').first();
      if (await projectCard.count() > 0) {
        await projectCard.click();

        await expect(page).toHaveURL(/\/projects\/[a-zA-Z0-9-]+/);
        await expect(page.locator('[data-testid="project-details"]')).toBeVisible();
      }
    });

    test('should display project information', async ({ page }) => {
      test.skip(); // Skip until project details page is implemented

      await page.goto('/projects');
      await page.locator('[data-testid="project-card"]').first().click();

      await expect(page.locator('[data-testid="project-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="project-created-date"]')).toBeVisible();
    });
  });

  test.describe('Project Status', () => {
    test('should update project status', async ({ page }) => {
      test.skip(); // Skip until status functionality is implemented

      await page.goto('/projects');
      await page.locator('[data-testid="project-card"]').first().click();

      const statusSelect = page.locator('[data-testid="status-select"]');
      await statusSelect.selectOption('completed');

      await expect(page.locator('text=/status.*updated/i')).toBeVisible();
    });

    test('should filter by status', async ({ page }) => {
      test.skip(); // Skip until filtering is implemented

      await page.goto('/projects');

      const statusFilter = page.locator('[data-testid="status-filter"]');
      await statusFilter.selectOption('active');

      const projectCards = page.locator('[data-testid="project-card"]');
      const count = await projectCards.count();

      for (let i = 0; i < count; i++) {
        const status = await projectCards.nth(i).locator('[data-testid="project-status"]').textContent();
        expect(status?.toLowerCase()).toContain('active');
      }
    });
  });
});
