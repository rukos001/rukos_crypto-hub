import { test, expect } from '@playwright/test';
import { loginAsAdmin, dismissToasts, removeEmergentBadge } from '../fixtures/helpers';

test.describe('Predictions Tab - Polymarket Integration', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    await removeEmergentBadge(page);
  });

  test('should see Predictions tab in dashboard tabs', async ({ page }) => {
    // Verify predictions tab is visible in the tabs list
    const predictionsTab = page.getByRole('tab', { name: /Predictions/i });
    await expect(predictionsTab).toBeVisible({ timeout: 10000 });
  });

  test('should click Predictions tab and see content', async ({ page }) => {
    // Click Predictions tab
    const predictionsTab = page.getByRole('tab', { name: /Predictions/i });
    await predictionsTab.click();
    
    // Wait for predictions content to load
    await expect(page.getByTestId('predictions-tab')).toBeVisible({ timeout: 15000 });
  });

  test('should display prediction events with probability bars', async ({ page }) => {
    // Navigate to predictions tab
    const predictionsTab = page.getByRole('tab', { name: /Predictions/i });
    await predictionsTab.click();
    await expect(page.getByTestId('predictions-tab')).toBeVisible({ timeout: 15000 });
    
    // Check that at least the first event card is displayed
    const firstEvent = page.locator('[data-testid="prediction-event-1"]');
    await expect(firstEvent).toBeVisible({ timeout: 10000 });
    
    // Should have probability bars (Yes/No colors)
    await expect(firstEvent.locator('.text-emerald-400').first()).toBeVisible();
    await expect(firstEvent.locator('.text-rose-400').first()).toBeVisible();
  });

  test('should show Polymarket source and markets count', async ({ page }) => {
    // Navigate to predictions tab
    await page.getByRole('tab', { name: /Predictions/i }).click();
    await expect(page.getByTestId('predictions-tab')).toBeVisible({ timeout: 15000 });
    
    // Check for Polymarket source
    await expect(page.getByText(/polymarket/i)).toBeVisible({ timeout: 10000 });
    
    // Check for markets count badge
    await expect(page.getByText(/рынков/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show external links to Polymarket events', async ({ page }) => {
    // Navigate to predictions tab
    await page.getByRole('tab', { name: /Predictions/i }).click();
    await expect(page.getByTestId('predictions-tab')).toBeVisible({ timeout: 15000 });
    
    // Check for polymarket.com links
    const polymarketLinks = page.locator('a[href*="polymarket.com"]');
    await expect(polymarketLinks.first()).toBeVisible({ timeout: 10000 });
  });
});
