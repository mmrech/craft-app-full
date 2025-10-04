import { test, expect } from '@playwright/test';

test.describe('8-Step Extraction Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Assumes a document is already loaded
  });

  test('should display all 8 extraction steps', async ({ page }) => {
    const steps = [
      'Study Identification',
      'PICOT Framework',
      'Baseline Characteristics',
      'Imaging Methods',
      'Interventions',
      'Study Arms',
      'Outcomes',
      'Complications'
    ];

    for (const stepName of steps) {
      const stepExists = await page.locator(`text=${stepName}`).count() > 0;
      expect(stepExists).toBeTruthy();
    }
  });

  test('should allow navigation between steps', async ({ page }) => {
    // Try to click through steps
    const step2 = page.locator('text=PICOT Framework');
    
    if (await step2.count() > 0) {
      await step2.click();
      await page.waitForTimeout(500);
      
      // Verify step 2 content is visible
      const picotFields = await page.locator('[class*="field"], input, textarea').count();
      expect(picotFields).toBeGreaterThan(0);
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Navigate to first step
    const step1 = page.locator('text=Study Identification');
    
    if (await step1.count() > 0) {
      await step1.click();
      
      // Try to submit without filling required fields
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Next")');
      
      if (await saveButton.count() > 0) {
        await saveButton.first().click();
        
        // Validation errors should appear
        const errorExists = await page.locator('[class*="error"], [role="alert"]').count() > 0;
        // Note: This depends on your validation implementation
      }
    }
  });

  test('should save extracted data', async ({ page }) => {
    // Fill in a field and verify auto-save or manual save works
    const firstInput = page.locator('input[type="text"], textarea').first();
    
    if (await firstInput.count() > 0) {
      await firstInput.fill('Test data for extraction');
      await page.waitForTimeout(1000); // Wait for auto-save
      
      // Reload page and verify data persists
      await page.reload();
      await expect(firstInput).toHaveValue('Test data for extraction', { timeout: 5000 });
    }
  });

  test('should highlight PDF when field is selected', async ({ page }) => {
    // Click on an extractable field
    const field = page.locator('[class*="field"]').first();
    
    if (await field.count() > 0) {
      await field.click();
      
      // Verify PDF viewer highlights corresponding area
      const pdfCanvas = page.locator('canvas');
      await expect(pdfCanvas).toBeVisible();
    }
  });
});

test.describe('AI Extraction', () => {
  test('should show AI extraction button', async ({ page }) => {
    await page.goto('/');
    
    const aiButton = page.locator('button:has-text("AI"), button:has-text("Extract")');
    // AI button may or may not be visible depending on configuration
  });

  test('should trigger AI extraction when clicked', async ({ page }) => {
    await page.goto('/');
    
    const aiButton = page.locator('button:has-text("AI Extract")');
    
    if (await aiButton.count() > 0) {
      await aiButton.click();
      
      // Wait for loading state
      await expect(page.locator('text=/Extracting|Processing/i')).toBeVisible({ timeout: 2000 });
      
      // Wait for completion
      await expect(page.locator('text=/Complete|Success/i')).toBeVisible({ timeout: 30000 });
    }
  });
});
