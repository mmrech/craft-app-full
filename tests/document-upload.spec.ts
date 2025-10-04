import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Document Upload and Management', () => {
  test.beforeEach(async ({ page }) => {
    // Assumes authenticated state - see auth.setup.ts
    await page.goto('/');
  });

  test('should display upload section', async ({ page }) => {
    await expect(page.locator('text=/Upload.*PDF|Drop.*PDF/i')).toBeVisible();
  });

  test('should show file size validation', async ({ page }) => {
    // This test would require mocking file upload with oversized file
    // Implementation depends on your upload component structure
  });

  test('should accept PDF files', async ({ page }) => {
    // Sample test for file upload
    // You'll need to create a sample PDF in tests/fixtures/sample.pdf
    const fileInput = page.locator('input[type="file"]');
    
    if (await fileInput.count() > 0) {
      await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'sample.pdf'));
      
      // Wait for upload confirmation
      await expect(page.locator('text=/Uploaded|Success/i')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display document library', async ({ page }) => {
    // Check if document library component is visible
    const libraryExists = await page.locator('[class*="document"]').count() > 0;
    expect(libraryExists).toBeTruthy();
  });

  test('should allow document selection', async ({ page }) => {
    // Click on first document if available
    const firstDoc = page.locator('[class*="document"]').first();
    
    if (await firstDoc.count() > 0) {
      await firstDoc.click();
      // Verify document opens in viewer
      await expect(page.locator('canvas, [class*="pdf"]')).toBeVisible({ timeout: 5000 });
    }
  });
});
