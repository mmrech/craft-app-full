# Playwright Testing Setup Guide

## Overview

This guide will help you set up and run end-to-end tests for the Clinical Extraction System using Playwright locally.

## Prerequisites

- Node.js 18+ installed
- Access to your deployed Lovable app URL
- Test user credentials (or ability to create test accounts)

## Installation

### 1. Install Playwright

```bash
npm install -D @playwright/test@latest
npx playwright install
```

This installs Playwright and downloads browser binaries (Chromium, Firefox, WebKit).

### 2. Configure Environment Variables

Create a `.env.test` file in the project root:

```env
# Your deployed Lovable app URL
PLAYWRIGHT_BASE_URL=https://your-app.lovable.app

# Test user credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123
```

### 3. Update Playwright Config

The `playwright.config.ts` file is already configured. Update the `baseURL` if needed:

```typescript
use: {
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://your-app.lovable.app',
  // ...
}
```

## Running Tests

### Run All Tests

```bash
npx playwright test
```

### Run Specific Test File

```bash
npx playwright test tests/auth.spec.ts
```

### Run Tests in UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Run Tests in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

### Run Tests on Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Debug Tests

```bash
npx playwright test --debug
```

## Test Structure

### Available Test Suites

1. **Authentication Tests** (`tests/auth.spec.ts`)
   - Login/logout flows
   - Signup validation
   - Session persistence

2. **Document Upload Tests** (`tests/document-upload.spec.ts`)
   - PDF upload functionality
   - File validation
   - Document library

3. **Extraction Workflow Tests** (`tests/extraction-workflow.spec.ts`)
   - 8-step extraction process
   - Field validation
   - Data persistence

4. **PDF Viewer Tests** (`tests/pdf-viewer.spec.ts`)
   - Page navigation
   - Zoom controls
   - Text selection
   - Annotation mode

5. **Data Export Tests** (`tests/data-export.spec.ts`)
   - CSV export
   - Excel export
   - JSON export

## Authentication Setup

For tests that require authentication, use the setup file:

```bash
npx playwright test tests/auth.setup.ts
```

This creates an authenticated session stored in `playwright/.auth/user.json`.

Then, in your test file:

```typescript
import { test } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/user.json' });

test('authenticated test', async ({ page }) => {
  // User is already logged in
  await page.goto('/');
});
```

## Adding Test Fixtures

Place sample PDF files in `tests/fixtures/`:

```
tests/fixtures/
├── sample.pdf          # Small sample document
├── large.pdf           # Large file for testing limits
└── multi-page.pdf      # Multi-page document
```

**Important**: Never commit real patient data or PHI!

## Viewing Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## Best Practices

### 1. Use Test Data Attributes

Add `data-testid` attributes to your components for reliable selectors:

```tsx
<button data-testid="export-button">Export</button>
```

Then in tests:

```typescript
await page.getByTestId('export-button').click();
```

### 2. Wait for Network Idle

For pages with async data:

```typescript
await page.goto('/', { waitUntil: 'networkidle' });
```

### 3. Use Soft Assertions

For multiple checks:

```typescript
await expect.soft(page.locator('.step-1')).toBeVisible();
await expect.soft(page.locator('.step-2')).toBeVisible();
```

### 4. Take Screenshots on Failure

Already configured in `playwright.config.ts`:

```typescript
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/playwright.yml`:

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      
      - name: Run Playwright tests
        run: npx playwright test
        env:
          PLAYWRIGHT_BASE_URL: ${{ secrets.PLAYWRIGHT_BASE_URL }}
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
      
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### Tests Timeout

Increase timeout in `playwright.config.ts`:

```typescript
use: {
  actionTimeout: 10000,
  navigationTimeout: 30000,
}
```

### Browser Not Found

Reinstall browsers:

```bash
npx playwright install --force
```

### Authentication Issues

1. Verify test credentials are correct
2. Check Supabase URL configuration in Settings
3. Ensure email confirmation is disabled for test accounts

### Flaky Tests

Use retry logic:

```typescript
test('flaky test', async ({ page }) => {
  await test.step('attempt with retry', async () => {
    // Test code
  });
});
```

Or configure retries:

```typescript
// playwright.config.ts
retries: 2,
```

## Test Coverage

Run tests and generate coverage:

```bash
npx playwright test --reporter=html,json
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Setup](https://playwright.dev/docs/ci)

## Next Steps

1. Create test accounts in your Supabase project
2. Add sample PDF fixtures
3. Run initial test suite
4. Review and update test cases based on your specific workflows
5. Set up CI/CD pipeline
6. Monitor test results and improve coverage

## Support

For issues or questions:
- Check the [TESTING_GUIDE.md](./TESTING_GUIDE.md) for manual testing procedures
- Review [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues
- Contact the development team
