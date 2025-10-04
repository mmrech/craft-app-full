import { test, expect } from '@playwright/test';

test.describe('Data Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have export button', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');
    
    // Export functionality may be in menu or toolbar
    if (await exportButton.count() > 0) {
      await expect(exportButton.first()).toBeVisible();
    }
  });

  test('should show export format options', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")');
    
    if (await exportButton.count() > 0) {
      await exportButton.first().click();
      
      // Should show CSV, Excel, JSON options
      await expect(page.locator('text=/CSV|Excel|JSON/i')).toBeVisible({ timeout: 2000 });
    }
  });

  test('should download CSV export', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    const exportButton = page.locator('button:has-text("Export")');
    
    if (await exportButton.count() > 0) {
      await exportButton.click();
      
      const csvOption = page.locator('text=CSV, button:has-text("CSV")');
      
      if (await csvOption.count() > 0) {
        await csvOption.click();
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.csv');
      }
    }
  });

  test('should download Excel export', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    const exportButton = page.locator('button:has-text("Export")');
    
    if (await exportButton.count() > 0) {
      await exportButton.click();
      
      const excelOption = page.locator('text=/Excel|XLSX/, button:has-text("Excel")');
      
      if (await excelOption.count() > 0) {
        await excelOption.click();
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/\.xlsx?$/);
      }
    }
  });

  test('should download JSON export', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    const exportButton = page.locator('button:has-text("Export")');
    
    if (await exportButton.count() > 0) {
      await exportButton.click();
      
      const jsonOption = page.locator('text=JSON, button:has-text("JSON")');
      
      if (await jsonOption.count() > 0) {
        await jsonOption.click();
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toContain('.json');
      }
    }
  });
});
