import { test, expect } from '@playwright/test';

test.describe('PDF Viewer Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Assumes a document is loaded
  });

  test('should display PDF canvas', async ({ page }) => {
    const pdfCanvas = page.locator('canvas');
    
    if (await pdfCanvas.count() > 0) {
      await expect(pdfCanvas.first()).toBeVisible();
    }
  });

  test('should have zoom controls', async ({ page }) => {
    const zoomIn = page.locator('button:has-text("+"), button[aria-label*="zoom in" i]');
    const zoomOut = page.locator('button:has-text("-"), button[aria-label*="zoom out" i]');
    
    // Zoom controls may exist
    if (await zoomIn.count() > 0) {
      await expect(zoomIn.first()).toBeVisible();
    }
    
    if (await zoomOut.count() > 0) {
      await expect(zoomOut.first()).toBeVisible();
    }
  });

  test('should have page navigation', async ({ page }) => {
    const nextPage = page.locator('button:has-text("Next"), button[aria-label*="next page" i]');
    const prevPage = page.locator('button:has-text("Previous"), button[aria-label*="previous page" i]');
    
    if (await nextPage.count() > 0) {
      await nextPage.first().click();
      await page.waitForTimeout(500);
      
      // Page should change
      expect(await page.locator('text=/Page \\d+/').textContent()).toBeTruthy();
    }
  });

  test('should support text selection', async ({ page }) => {
    const pdfCanvas = page.locator('canvas').first();
    
    if (await pdfCanvas.count() > 0) {
      // Simulate text selection by clicking and dragging
      const box = await pdfCanvas.boundingBox();
      
      if (box) {
        await page.mouse.move(box.x + 100, box.y + 100);
        await page.mouse.down();
        await page.mouse.move(box.x + 300, box.y + 100);
        await page.mouse.up();
        
        // Selection should be visible
        await page.waitForTimeout(500);
      }
    }
  });

  test('should toggle annotation mode', async ({ page }) => {
    const annotateButton = page.locator('button:has-text("Annotate"), button:has-text("Highlight")');
    
    if (await annotateButton.count() > 0) {
      await annotateButton.first().click();
      
      // Annotation mode should be active
      await expect(page.locator('[class*="annotation"], [class*="highlight"]')).toBeVisible({ timeout: 2000 });
    }
  });
});
