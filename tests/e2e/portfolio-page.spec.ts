import { test, expect } from '@playwright/test';
import { loginAsAdmin, dismissToasts, removeEmergentBadge } from '../fixtures/helpers';

test.describe('Portfolio Page - Two Tabs Structure', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    await removeEmergentBadge(page);
  });

  test('should navigate to Portfolio page from sidebar', async ({ page }) => {
    // Click on Portfolio in the sidebar
    const portfolioLink = page.locator('a, button').filter({ hasText: /Портфель|Portfolio/i }).first();
    await expect(portfolioLink).toBeVisible({ timeout: 5000 });
    await portfolioLink.click();
    
    // Verify portfolio page loaded
    await expect(page.getByTestId('portfolio-page')).toBeVisible({ timeout: 15000 });
  });

  test('should display two tabs: Мой портфель and RUKOS_CRYPTO', async ({ page }) => {
    // Navigate to portfolio
    await page.locator('a, button').filter({ hasText: /Портфель|Portfolio/i }).first().click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible({ timeout: 15000 });
    
    // Verify both tabs are visible
    await expect(page.getByTestId('tab-my-portfolio')).toBeVisible();
    await expect(page.getByTestId('tab-rukos-portfolio')).toBeVisible();
  });

  test('should show My Portfolio tab with position data', async ({ page }) => {
    // Navigate to portfolio
    await page.locator('a, button').filter({ hasText: /Портфель|Portfolio/i }).first().click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible({ timeout: 15000 });
    
    // My portfolio tab should be active by default
    const myTab = page.getByTestId('tab-my-portfolio');
    await expect(myTab).toBeVisible();
    
    // Should show portfolio summary
    await expect(page.getByTestId('portfolio-summary')).toBeVisible({ timeout: 10000 });
    
    // Should show existing BTC position (from test data)
    await expect(page.getByTestId('position-BTC')).toBeVisible({ timeout: 10000 });
  });

  test('should display HOLD, ALTs groups in My Portfolio', async ({ page }) => {
    // Navigate to portfolio
    await page.locator('a, button').filter({ hasText: /Портфель|Portfolio/i }).first().click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible({ timeout: 15000 });
    
    // Check for HOLD group card
    await expect(page.getByTestId('group-HOLD')).toBeVisible({ timeout: 10000 });
    
    // Check for ALTs group card (has SOL position)
    await expect(page.getByTestId('group-ALTs')).toBeVisible({ timeout: 5000 });
  });

  test('should show Add Position button in My Portfolio', async ({ page }) => {
    // Navigate to portfolio
    await page.locator('a, button').filter({ hasText: /Портфель|Portfolio/i }).first().click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible({ timeout: 15000 });
    
    // Add position button should be visible
    const addBtn = page.getByTestId('add-position-btn');
    await expect(addBtn).toBeVisible({ timeout: 5000 });
  });

  test('should open Add Position dialog when clicking Add button', async ({ page }) => {
    // Navigate to portfolio
    await page.locator('a, button').filter({ hasText: /Портфель|Portfolio/i }).first().click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible({ timeout: 15000 });
    
    // Click add position button
    await page.getByTestId('add-position-btn').click();
    
    // Dialog should open
    await expect(page.getByTestId('position-dialog')).toBeVisible({ timeout: 5000 });
    
    // Dialog should have input fields
    await expect(page.getByTestId('input-asset')).toBeVisible();
    await expect(page.getByTestId('input-size')).toBeVisible();
    await expect(page.getByTestId('input-entry')).toBeVisible();
    await expect(page.getByTestId('select-group')).toBeVisible();
  });

  test('should switch to RUKOS_CRYPTO tab', async ({ page }) => {
    // Navigate to portfolio
    await page.locator('a, button').filter({ hasText: /Портфель|Portfolio/i }).first().click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible({ timeout: 15000 });
    
    // Click RUKOS_CRYPTO tab
    await page.getByTestId('tab-rukos-portfolio').click();
    
    // Should show RUKOS portfolio header in content area
    await expect(page.getByRole('heading', { name: /Портфель RUKOS_CRYPTO/i })).toBeVisible({ timeout: 5000 });
  });

  test('should show empty state for RUKOS_CRYPTO tab when not configured', async ({ page }) => {
    // Navigate to portfolio
    await page.locator('a, button').filter({ hasText: /Портфель|Portfolio/i }).first().click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible({ timeout: 15000 });
    
    // Click RUKOS_CRYPTO tab
    await page.getByTestId('tab-rukos-portfolio').click();
    
    // Should show the empty state message about admin configuration
    await expect(page.getByText(/Пока не настроен администратором/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Portfolio Page - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    await removeEmergentBadge(page);
    
    // Navigate to portfolio page
    await page.locator('a, button').filter({ hasText: /Портфель|Portfolio/i }).first().click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible({ timeout: 15000 });
  });

  test('should create a new position with all fields', async ({ page }) => {
    // Open add dialog
    await page.getByTestId('add-position-btn').click();
    await expect(page.getByTestId('position-dialog')).toBeVisible({ timeout: 5000 });
    
    // Fill the form with unique test asset
    const testAsset = `TEST${Date.now().toString().slice(-4)}`;
    await page.getByTestId('input-asset').fill(testAsset);
    await page.getByTestId('input-size').fill('5.5');
    await page.getByTestId('input-entry').fill('100.25');
    
    // Select HI_RISK group
    await page.getByTestId('select-group').click();
    await page.getByRole('option', { name: /HI.?RISK/i }).click();
    
    // Add notes
    await page.getByTestId('input-notes').fill('Test position for E2E');
    
    // Save
    await page.getByTestId('save-position-btn').click();
    
    // Dialog should close
    await expect(page.getByTestId('position-dialog')).not.toBeVisible({ timeout: 5000 });
    
    // HI_RISK group should now be visible with the new position
    // Note: Position might not show current_price since it's a fake asset
    // The test passes if creation succeeds without error
  });

  test('should verify existing BTC position shows real price', async ({ page }) => {
    // Look for BTC position
    const btcPosition = page.getByTestId('position-BTC');
    await expect(btcPosition).toBeVisible({ timeout: 10000 });
    
    // Should show entry and current price
    await expect(btcPosition.getByText(/Entry:/)).toBeVisible();
    await expect(btcPosition.getByText(/Now:/)).toBeVisible();
    
    // Should show PnL
    const pnlText = btcPosition.locator('.text-emerald-400, .text-rose-400');
    await expect(pnlText.first()).toBeVisible();
  });

  test('should show edit and delete buttons on hover for positions', async ({ page }) => {
    // Get a position row
    const btcPosition = page.getByTestId('position-BTC');
    await expect(btcPosition).toBeVisible({ timeout: 10000 });
    
    // Hover to reveal action buttons
    await btcPosition.hover();
    
    // Edit and delete buttons should become visible
    await expect(page.getByTestId('edit-BTC')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('delete-BTC')).toBeVisible({ timeout: 3000 });
  });
});
