# Testing Documentation

This document provides comprehensive information about testing in the product-listing application.

## Table of Contents

- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [E2E Tests](#e2e-tests)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [Accessibility Tests](#accessibility-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Writing Tests](#writing-tests)

## Test Structure

```
product-listing/
├── e2e/                          # End-to-end tests (Playwright)
│   ├── helpers/                  # Test utilities
│   │   └── auth.ts              # Authentication helpers
│   ├── fixtures/                 # Test data
│   │   └── testData.ts          # Centralized test data
│   ├── auth.spec.ts             # Authentication flow tests
│   ├── projects.spec.ts         # Project management tests
│   ├── file-upload.spec.ts      # File upload tests
│   ├── brand-kits.spec.ts       # Brand kit tests
│   └── accessibility.spec.ts    # Accessibility tests
├── src/
│   └── components/
│       └── __tests__/           # Component unit tests (Vitest)
│           ├── Navigation.test.tsx
│           └── HowItWorks.test.tsx
├── tests/                        # Test configuration
│   └── setup.ts                 # Vitest setup
├── playwright.config.ts          # Playwright configuration
└── vitest.config.ts             # Vitest configuration
```

## Running Tests

### Unit Tests (Vitest)

Run all unit tests:
```bash
npm test
```

Watch mode for development:
```bash
npm run test:watch
```

Run tests with UI:
```bash
npm run test:ui
```

Generate coverage report:
```bash
npm run test:coverage
```

### E2E Tests (Playwright)

Run all E2E tests:
```bash
npm run test:e2e
```

Run with Playwright UI:
```bash
npm run test:e2e:ui
```

Run in headed mode (see browser):
```bash
npm run test:e2e:headed
```

Debug mode:
```bash
npm run test:e2e:debug
```

### Browser-Specific Tests

Test on Chromium only:
```bash
npm run test:e2e:chromium
```

Test on Firefox:
```bash
npm run test:e2e:firefox
```

Test on WebKit (Safari):
```bash
npm run test:e2e:webkit
```

Test on mobile devices:
```bash
npm run test:e2e:mobile
```

### Run All Tests

```bash
npm run test:all
```

### CI Mode

```bash
npm run test:ci
```

## E2E Tests

### Authentication Tests (`e2e/auth.spec.ts`)

Tests authentication flows including:
- Sign in page rendering
- Form validation
- Invalid credentials handling
- Successful sign-in
- Session persistence
- Sign-up flow
- Sign-out functionality
- Protected routes
- Session management

### Project Management Tests (`e2e/projects.spec.ts`)

Tests project CRUD operations:
- Project list display
- Creating new projects
- Editing existing projects
- Deleting projects
- Project details page
- Project status updates
- Search and filtering

### File Upload Tests (`e2e/file-upload.spec.ts`)

Tests file handling:
- Image upload interface
- Single and multiple file uploads
- File type validation
- File size validation
- Drag and drop functionality
- Upload progress indicators
- Upload cancellation
- Error handling

### Brand Kit Tests (`e2e/brand-kits.spec.ts`)

Tests brand kit management:
- Brand kit creation
- Color picker functionality
- Logo upload
- Brand kit editing
- Brand kit deletion
- Applying brand kits to projects

### Accessibility Tests (`e2e/accessibility.spec.ts`)

Tests WCAG compliance:
- Automated accessibility scanning
- Keyboard navigation
- Screen reader support
- Color contrast
- Focus management
- Responsive design accessibility

## Unit Tests

### Component Tests

Component tests are located in `src/components/__tests__/`:

**Navigation Component Tests:**
- Rendering all navigation elements
- Mobile menu toggle
- Theme colors application
- Accessibility attributes

**HowItWorks Component Tests:**
- Rendering section content
- Step descriptions
- Call-to-action buttons
- Theme consistency

**ColorPicker Component Tests:**
- Color input rendering
- Color value display
- onChange event handling
- Color format validation
- Color preview

## Integration Tests

Integration tests combine multiple components or test API interactions:

### tRPC API Tests (Coming Soon)
- Project API endpoints
- Brand kit API endpoints
- File upload API endpoints
- Authentication API

### Database Tests (Coming Soon)
- Prisma model operations
- Data integrity
- Relationships
- Transactions

## Accessibility Tests

Our accessibility tests ensure WCAG 2.1 Level AA compliance:

### Automated Scanning
- Uses `@axe-core/playwright` for automated accessibility checks
- Scans all major pages for violations
- Tests both light and dark modes

### Manual Tests
- Keyboard navigation flows
- Screen reader compatibility
- Focus management
- Color contrast ratios
- ARIA attributes

### Responsive Accessibility
- Tests on multiple viewport sizes:
  - Mobile (375x667)
  - Tablet (768x1024)
  - Desktop (1920x1080)

## Test Coverage

Generate a coverage report:
```bash
npm run test:coverage
```

Coverage reports are generated in:
- `coverage/` - HTML report
- `coverage/lcov.info` - LCOV format for CI tools

### Coverage Goals

- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

## CI/CD Integration

### GitHub Actions

Add this workflow to `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            playwright-report/
            coverage/
            test-results/

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interactions', async () => {
    const { user } = render(<MyComponent />);
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/feature');
  });

  test('should perform action', async ({ page }) => {
    await page.click('[data-testid="action-button"]');
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid attributes** for E2E test selectors
2. **Test user behavior** not implementation details
3. **Keep tests isolated** - each test should be independent
4. **Use descriptive test names** that explain what is being tested
5. **Follow the AAA pattern** - Arrange, Act, Assert
6. **Mock external dependencies** in unit tests
7. **Test accessibility** in all components
8. **Keep tests maintainable** - use helpers and fixtures

### Test Data

Centralize test data in `e2e/fixtures/testData.ts`:

```typescript
export const testUsers = {
  validUser: {
    email: 'test@example.com',
    password: 'TestPassword123!',
  },
};
```

### Test Helpers

Create reusable helpers in `e2e/helpers/`:

```typescript
export async function signIn(page: Page, user: TestUser) {
  await page.goto('/auth/signin');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
}
```

## Debugging Tests

### Playwright

Debug specific test:
```bash
npx playwright test auth.spec.ts --debug
```

Generate trace:
```bash
npx playwright test --trace on
```

View trace:
```bash
npx playwright show-trace trace.zip
```

### Vitest

Debug in VS Code:
1. Set breakpoints in test files
2. Run "Debug Test" from VS Code

Debug in browser:
```bash
npm run test:ui
```

## Troubleshooting

### Common Issues

**Tests timing out:**
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify network requests aren't blocked

**Component tests failing:**
- Check if all mocks are properly set up in `tests/setup.ts`
- Verify imports are correct
- Ensure React Testing Library version compatibility

**E2E tests flaky:**
- Add explicit waits for elements
- Use `page.waitForLoadState('networkidle')`
- Increase retry count for CI

### Getting Help

- Check test output for detailed error messages
- Review Playwright trace for E2E failures
- Check coverage report for untested code paths
- Consult Playwright docs: https://playwright.dev
- Consult Vitest docs: https://vitest.dev

## Continuous Improvement

- Review and update tests when adding new features
- Maintain test coverage above 80%
- Regular accessibility audits
- Keep testing dependencies up to date
- Monitor test execution time and optimize slow tests
