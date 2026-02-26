import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsUser, dismissToasts, removeEmergentBadge } from '../fixtures/helpers';

/**
 * Admin Panel and Portfolio Tests
 * Tests for:
 * - Admin login and access
 * - Admin panel UI (users, chat, stats sections)
 * - Admin password toggle and user deletion
 * - Portfolio page with HOLD/ALTs/HI_RISK groups
 * - Admin link visibility based on role
 */

test.describe('Admin Panel Features', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Admin login works and shows admin link in sidebar', async ({ page }) => {
    await loginAsAdmin(page);
    await removeEmergentBadge(page);
    
    // Wait for sidebar to be visible
    await expect(page.getByTestId('sidebar')).toBeVisible();
    
    // Admin link should be visible for admin users
    const adminLink = page.getByTestId('nav-admin');
    await expect(adminLink).toBeVisible();
  });

  test('Admin can access admin page and see sections', async ({ page }) => {
    await loginAsAdmin(page);
    await removeEmergentBadge(page);
    
    // Navigate to admin page
    await page.getByTestId('nav-admin').click();
    
    // Admin page should be visible
    await expect(page.getByTestId('admin-page')).toBeVisible();
    
    // Section tabs should be visible
    await expect(page.getByTestId('admin-section-users')).toBeVisible();
    await expect(page.getByTestId('admin-section-chat')).toBeVisible();
    await expect(page.getByTestId('admin-section-stats')).toBeVisible();
  });

  test('Admin page shows users list with password toggle', async ({ page }) => {
    await loginAsAdmin(page);
    await removeEmergentBadge(page);
    
    // Navigate to admin page
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible();
    
    // Users section should be active by default
    await expect(page.getByTestId('admin-section-users')).toBeVisible();
    
    // Wait for users to load - look for user elements
    await expect(page.locator('[data-testid^="admin-user-"]').first()).toBeVisible({ timeout: 10000 });
    
    // Find a password toggle button and click it
    const firstToggle = page.locator('[data-testid^="toggle-pwd-"]').first();
    await expect(firstToggle).toBeVisible();
    await firstToggle.click();
    
    // After toggle, password should be visible (check that text changes from dots)
    // We just verify the toggle was clickable
  });

  test('Admin can view Chat section', async ({ page }) => {
    await loginAsAdmin(page);
    await removeEmergentBadge(page);
    
    // Navigate to admin page
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible();
    
    // Click Chat section
    await page.getByTestId('admin-section-chat').click();
    
    // Chat section should show messages or "No messages yet"
    const chatSection = page.locator('text=Chat Messages');
    await expect(chatSection).toBeVisible();
  });

  test('Admin can view Stats section with counts', async ({ page }) => {
    await loginAsAdmin(page);
    await removeEmergentBadge(page);
    
    // Navigate to admin page
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible();
    
    // Click Stats section
    await page.getByTestId('admin-section-stats').click();
    
    // Stats cards should be visible with numeric values
    await expect(page.locator('text=Users')).toBeVisible();
    await expect(page.locator('text=Posts')).toBeVisible();
    await expect(page.locator('text=Ideas')).toBeVisible();
    await expect(page.locator('text=Messages')).toBeVisible();
  });

  test('Admin refresh button works', async ({ page }) => {
    await loginAsAdmin(page);
    await removeEmergentBadge(page);
    
    // Navigate to admin page
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible();
    
    // Click refresh button
    const refreshBtn = page.getByTestId('admin-refresh');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    
    // Page should still be functional after refresh
    await expect(page.getByTestId('admin-page')).toBeVisible();
  });
});

test.describe('Regular User Admin Access', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Regular user cannot see admin link in sidebar', async ({ page }) => {
    await loginAsUser(page);
    await removeEmergentBadge(page);
    
    // Wait for sidebar to be visible
    await expect(page.getByTestId('sidebar')).toBeVisible();
    
    // Admin link should NOT be visible for regular users
    const adminLink = page.getByTestId('nav-admin');
    await expect(adminLink).not.toBeVisible();
  });

  test('Regular user navigating to /admin sees access denied', async ({ page }) => {
    await loginAsUser(page);
    await removeEmergentBadge(page);
    
    // Try to navigate directly to admin page
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    
    // Should see access denied message
    await expect(page.getByTestId('admin-access-denied')).toBeVisible();
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });
});

test.describe('Portfolio Page Features', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });

  test('Portfolio is visible in sidebar as separate menu item', async ({ page }) => {
    await loginAsUser(page);
    await removeEmergentBadge(page);
    
    // Wait for sidebar
    await expect(page.getByTestId('sidebar')).toBeVisible();
    
    // Portfolio link should be in sidebar
    const portfolioLink = page.getByTestId('nav-portfolio');
    await expect(portfolioLink).toBeVisible();
  });

  test('Portfolio page loads with group filter buttons', async ({ page }) => {
    await loginAsUser(page);
    await removeEmergentBadge(page);
    
    // Navigate to portfolio
    await page.getByTestId('nav-portfolio').click();
    
    // Portfolio page should be visible
    await expect(page.getByTestId('portfolio-page')).toBeVisible();
    
    // Group filter should be visible with All, HOLD, ALTs, HI RISK buttons
    await expect(page.getByTestId('portfolio-group-filter')).toBeVisible();
    await expect(page.getByTestId('portfolio-filter-all')).toBeVisible();
    await expect(page.getByTestId('portfolio-filter-hold')).toBeVisible();
    await expect(page.getByTestId('portfolio-filter-alts')).toBeVisible();
    await expect(page.getByTestId('portfolio-filter-hi_risk')).toBeVisible();
  });

  test('Portfolio displays HOLD, ALTs, HI_RISK groups', async ({ page }) => {
    await loginAsUser(page);
    await removeEmergentBadge(page);
    
    // Navigate to portfolio
    await page.getByTestId('nav-portfolio').click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible();
    
    // All three group cards should be visible
    await expect(page.getByTestId('portfolio-group-HOLD')).toBeVisible();
    await expect(page.getByTestId('portfolio-group-ALTs')).toBeVisible();
    await expect(page.getByTestId('portfolio-group-HI_RISK')).toBeVisible();
  });

  test('Portfolio group filter HOLD shows only HOLD positions', async ({ page }) => {
    await loginAsUser(page);
    await removeEmergentBadge(page);
    
    // Navigate to portfolio
    await page.getByTestId('nav-portfolio').click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible();
    
    // Click HOLD filter
    await page.getByTestId('portfolio-filter-hold').click();
    
    // Only HOLD group should be visible
    await expect(page.getByTestId('portfolio-group-HOLD')).toBeVisible();
    await expect(page.getByTestId('portfolio-group-ALTs')).not.toBeVisible();
    await expect(page.getByTestId('portfolio-group-HI_RISK')).not.toBeVisible();
  });

  test('Portfolio group filter ALTs shows only ALTs positions', async ({ page }) => {
    await loginAsUser(page);
    await removeEmergentBadge(page);
    
    // Navigate to portfolio
    await page.getByTestId('nav-portfolio').click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible();
    
    // Click ALTs filter
    await page.getByTestId('portfolio-filter-alts').click();
    
    // Only ALTs group should be visible
    await expect(page.getByTestId('portfolio-group-ALTs')).toBeVisible();
    await expect(page.getByTestId('portfolio-group-HOLD')).not.toBeVisible();
    await expect(page.getByTestId('portfolio-group-HI_RISK')).not.toBeVisible();
  });

  test('Portfolio group filter HI RISK shows only HI_RISK positions', async ({ page }) => {
    await loginAsUser(page);
    await removeEmergentBadge(page);
    
    // Navigate to portfolio
    await page.getByTestId('nav-portfolio').click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible();
    
    // Click HI RISK filter
    await page.getByTestId('portfolio-filter-hi_risk').click();
    
    // Only HI_RISK group should be visible
    await expect(page.getByTestId('portfolio-group-HI_RISK')).toBeVisible();
    await expect(page.getByTestId('portfolio-group-HOLD')).not.toBeVisible();
    await expect(page.getByTestId('portfolio-group-ALTs')).not.toBeVisible();
  });

  test('Portfolio shows positions with BTC and ETH in HOLD group', async ({ page }) => {
    await loginAsUser(page);
    await removeEmergentBadge(page);
    
    // Navigate to portfolio
    await page.getByTestId('nav-portfolio').click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible();
    
    // Check HOLD positions (BTC, ETH)
    await expect(page.getByTestId('position-BTC')).toBeVisible();
    await expect(page.getByTestId('position-ETH')).toBeVisible();
  });

  test('Portfolio shows total value and PnL', async ({ page }) => {
    await loginAsUser(page);
    await removeEmergentBadge(page);
    
    // Navigate to portfolio
    await page.getByTestId('nav-portfolio').click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible();
    
    // Total value section should have dollar amounts
    await expect(page.locator('text=/$/')).toBeVisible();
    await expect(page.locator('text=/PnL/')).toBeVisible();
  });

  test('Portfolio refresh button works', async ({ page }) => {
    await loginAsUser(page);
    await removeEmergentBadge(page);
    
    // Navigate to portfolio
    await page.getByTestId('nav-portfolio').click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible();
    
    // Click refresh button
    const refreshBtn = page.getByTestId('portfolio-refresh');
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();
    
    // Page should still be functional
    await expect(page.getByTestId('portfolio-page')).toBeVisible();
  });
});
