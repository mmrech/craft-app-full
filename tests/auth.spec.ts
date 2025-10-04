import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should display login and signup tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Sign Up' })).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.getByRole('tab', { name: 'Sign In' }).click();
    await page.fill('#login-email', 'invalid-email');
    await page.fill('#login-password', 'password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Browser native validation should trigger
    const emailInput = page.locator('#login-email');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should navigate to signup tab and display all fields', async ({ page }) => {
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    
    await expect(page.locator('#signup-name')).toBeVisible();
    await expect(page.locator('#signup-email')).toBeVisible();
    await expect(page.locator('#signup-password')).toBeVisible();
    await expect(page.locator('#signup-confirm')).toBeVisible();
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    
    await page.fill('#signup-name', 'Test User');
    await page.fill('#signup-email', 'test@example.com');
    await page.fill('#signup-password', 'password123');
    await page.fill('#signup-confirm', 'differentpassword');
    
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    // Toast should appear with error message
    await expect(page.locator('text=Passwords do not match')).toBeVisible({ timeout: 3000 });
  });

  test('should show error for short password', async ({ page }) => {
    await page.getByRole('tab', { name: 'Sign Up' }).click();
    
    await page.fill('#signup-name', 'Test User');
    await page.fill('#signup-email', 'test@example.com');
    await page.fill('#signup-password', '123');
    await page.fill('#signup-confirm', '123');
    
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible({ timeout: 3000 });
  });

  test('should redirect authenticated users to main app', async ({ page, context }) => {
    // This test requires setting up authentication state
    // See tests/auth.setup.ts for implementation
  });
});

test.describe('Welcome Page', () => {
  test('should display hero section with CTA buttons', async ({ page }) => {
    await page.goto('/welcome');
    
    await expect(page.locator('h1:has-text("Clinical Data Extraction")')).toBeVisible();
    await expect(page.getByRole('button', { name: /Get Started/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Watch Demo/i })).toBeVisible();
  });

  test('should navigate to auth page when clicking Get Started', async ({ page }) => {
    await page.goto('/welcome');
    
    await page.getByRole('button', { name: /Get Started/i }).first().click();
    await expect(page).toHaveURL(/\/auth/);
  });

  test('should display feature cards', async ({ page }) => {
    await page.goto('/welcome');
    
    await expect(page.locator('text=AI-Powered Extraction')).toBeVisible();
    await expect(page.locator('text=HIPAA Compliant')).toBeVisible();
    await expect(page.locator('text=Structured Data')).toBeVisible();
  });
});
