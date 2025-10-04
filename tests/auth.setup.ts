import { test as setup } from '@playwright/test';

/**
 * Authentication Setup for Tests
 * This file handles setting up authenticated sessions for tests
 */

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  // Navigate to auth page
  await page.goto('/auth');

  // Fill in login credentials
  await page.fill('#login-email', process.env.TEST_USER_EMAIL || 'test@example.com');
  await page.fill('#login-password', process.env.TEST_USER_PASSWORD || 'testpassword123');

  // Click sign in
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for redirect to main app
  await page.waitForURL('/', { timeout: 10000 });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});

/**
 * To use authenticated state in tests:
 * 
 * test.use({ storageState: 'playwright/.auth/user.json' });
 * 
 * Or configure in playwright.config.ts:
 * {
 *   name: 'authenticated',
 *   use: { ...devices['Desktop Chrome'], storageState: authFile },
 *   dependencies: ['setup'],
 * }
 */
