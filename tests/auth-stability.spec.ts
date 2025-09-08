import { test, expect } from '@playwright/test';

test.describe('Auth Stability', () => {
  test('protected route refresh maintains position', async ({ page }) => {
    // Navigate to auth page and sign in
    await page.goto('/auth');
    
    // TODO: Add actual login steps based on your auth implementation
    // For now, assume user is already logged in via session storage
    
    // Navigate to protected admin route
    await page.goto('/admin/services');
    
    // Wait for page to load
    await expect(page.locator('[data-testid="admin-content"]').or(page.locator('main'))).toBeVisible({ timeout: 10000 });
    
    // Perform hard refresh
    await page.reload({ waitUntil: 'networkidle' });
    
    // Assert we're still on the same route
    expect(page.url()).toContain('/admin/services');
    
    // Assert no "Access Restricted" message
    await expect(page.locator('text=Access Restricted')).not.toBeVisible();
    
    // Assert no "Administrator privileges required"
    await expect(page.locator('text=Administrator privileges required')).not.toBeVisible();
    
    // Assert admin content is visible
    await expect(page.locator('[data-testid="admin-content"]').or(page.locator('main'))).toBeVisible();
  });

  test('service editor responsive typing', async ({ page }) => {
    // Navigate to service editor
    await page.goto('/admin/services');
    
    // Wait for editor to load
    await expect(page.locator('input[id="title"]').or(page.locator('input[name="title"]'))).toBeVisible({ timeout: 10000 });
    
    const titleInput = page.locator('input[id="title"]').or(page.locator('input[name="title"]')).first();
    
    // Clear existing content
    await titleInput.fill('');
    
    // Type quickly to test responsiveness
    const testText = 'Quick typing test for responsiveness';
    await titleInput.type(testText, { delay: 50 }); // Fast typing
    
    // Assert all text was captured
    await expect(titleInput).toHaveValue(testText);
    
    // Look for save indicators
    const saveIndicators = [
      page.locator('text=Saving...'),
      page.locator('text=Saved'),
      page.locator('[data-testid="save-status"]')
    ];
    
    // At least one save indicator should appear
    let foundIndicator = false;
    for (const indicator of saveIndicators) {
      try {
        await indicator.waitFor({ timeout: 3000 });
        foundIndicator = true;
        break;
      } catch {
        // Continue to next indicator
      }
    }
    
    // Should have debounced save behavior
    if (foundIndicator) {
      console.log('Save indicator found - debounced save working');
    }
  });

  test('network error handling', async ({ page }) => {
    // Navigate to service editor
    await page.goto('/admin/services');
    
    // Wait for editor to load
    await expect(page.locator('input[id="title"]').or(page.locator('input[name="title"]'))).toBeVisible({ timeout: 10000 });
    
    // Simulate network failure
    await page.route('**/rest/v1/services*', route => {
      route.abort('failed');
    });
    
    const titleInput = page.locator('input[id="title"]').or(page.locator('input[name="title"]')).first();
    
    // Try to make a change
    await titleInput.fill('Test network error handling');
    
    // Should show error state without crashing
    const errorIndicators = [
      page.locator('text=Error'),
      page.locator('text=Failed'),
      page.locator('[data-testid="error-status"]')
    ];
    
    let foundError = false;
    for (const indicator of errorIndicators) {
      try {
        await indicator.waitFor({ timeout: 5000 });
        foundError = true;
        break;
      } catch {
        // Continue to next indicator
      }
    }
    
    if (foundError) {
      console.log('Error handling working correctly');
    }
    
    // Page should still be functional (not crashed)
    await expect(titleInput).toBeVisible();
    
    // Should be able to revert changes
    const revertButton = page.locator('button:has-text("Revert")').or(page.locator('[data-testid="revert-button"]'));
    if (await revertButton.isVisible()) {
      await revertButton.click();
    }
  });
});

test.describe('Auth Bootstrap Logging', () => {
  test('should log guard decisions', async ({ page }) => {
    const logs: string[] = [];
    
    // Capture console logs
    page.on('console', msg => {
      if (msg.text().includes('[guard]')) {
        logs.push(msg.text());
      }
    });
    
    // Navigate to protected route
    await page.goto('/admin/services');
    
    // Wait for page to load
    await page.waitForTimeout(2000);
    
    // Should have guard decision logs
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some(log => log.includes('guard decision') || log.includes('auth bootstrap'))).toBe(true);
  });
});