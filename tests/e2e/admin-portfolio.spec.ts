import { test, expect } from '@playwright/test';

/**
 * Admin Panel and Portfolio Tests - Consolidated Spec
 * Tests for admin features and portfolio page
 */

// Helper function for admin login
async function loginAsAdmin(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Войти|Login/i }).click();
  await page.getByTestId('login-email-input').fill('admin@rukos.crypto');
  await page.getByTestId('login-password-input').fill('1661616irk');
  await page.getByTestId('login-submit-btn').click();
  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 15000 });
}

// Helper function for regular user login
async function loginAsUser(page, email = 'test@test.com', password = 'password123') {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Войти|Login/i }).click();
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-btn').click();
  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 15000 });
}

test.describe('Admin Panel Features', () => {
  test('Admin login shows admin link in sidebar', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('sidebar')).toBeVisible();
    await expect(page.getByTestId('nav-admin')).toBeVisible();
  });

  test('Admin can access admin page with all sections', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible();
    await expect(page.getByTestId('admin-section-users')).toBeVisible();
    await expect(page.getByTestId('admin-section-chat')).toBeVisible();
    await expect(page.getByTestId('admin-section-stats')).toBeVisible();
  });

  test('Admin users list has password toggle and delete buttons', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible();
    await expect(page.locator('[data-testid^="admin-user-"]').first()).toBeVisible({ timeout: 10000 });
    // Check password toggle
    const toggle = page.locator('[data-testid^="toggle-pwd-"]').first();
    await expect(toggle).toBeVisible();
    await toggle.click();
    // Check delete button exists for non-admin users
    await expect(page.locator('[data-testid^="delete-user-"]').first()).toBeVisible();
  });

  test('Admin stats section shows counts', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible();
    await page.getByTestId('admin-section-stats').click();
    // Stats cards visible - use more specific selectors
    await expect(page.locator('.glass-card').filter({ hasText: 'Users' })).toBeVisible();
    await expect(page.locator('.glass-card').filter({ hasText: 'Posts' })).toBeVisible();
  });
});

test.describe('Regular User Admin Access', () => {
  test('Regular user cannot see admin link in sidebar', async ({ page }) => {
    await loginAsUser(page);
    await expect(page.getByTestId('sidebar')).toBeVisible();
    await expect(page.getByTestId('nav-admin')).not.toBeVisible();
    // But portfolio should be visible
    await expect(page.getByTestId('nav-portfolio')).toBeVisible();
  });

  test('Regular user navigating to /admin sees access denied', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('admin-access-denied')).toBeVisible();
    await expect(page.locator('text=Access Denied')).toBeVisible();
  });
});

test.describe('Portfolio Page Features', () => {
  test('Portfolio is visible in sidebar as separate menu item', async ({ page }) => {
    await loginAsUser(page);
    await expect(page.getByTestId('sidebar')).toBeVisible();
    await expect(page.getByTestId('nav-portfolio')).toBeVisible();
  });

  test('Portfolio page loads with group filter buttons', async ({ page }) => {
    await loginAsUser(page);
    await page.getByTestId('nav-portfolio').click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible();
    await expect(page.getByTestId('portfolio-filter-all')).toBeVisible();
    await expect(page.getByTestId('portfolio-filter-hold')).toBeVisible();
    await expect(page.getByTestId('portfolio-filter-alts')).toBeVisible();
    await expect(page.getByTestId('portfolio-filter-hi_risk')).toBeVisible();
  });

  test('Portfolio displays HOLD, ALTs, HI_RISK groups', async ({ page }) => {
    await loginAsUser(page);
    await page.getByTestId('nav-portfolio').click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible();
    await expect(page.getByTestId('portfolio-group-HOLD')).toBeVisible();
    await expect(page.getByTestId('portfolio-group-ALTs')).toBeVisible();
    await expect(page.getByTestId('portfolio-group-HI_RISK')).toBeVisible();
  });

  test('Portfolio HOLD filter shows only HOLD positions', async ({ page }) => {
    await loginAsUser(page);
    await page.getByTestId('nav-portfolio').click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible();
    await page.getByTestId('portfolio-filter-hold').click();
    await expect(page.getByTestId('portfolio-group-HOLD')).toBeVisible();
    await expect(page.getByTestId('portfolio-group-ALTs')).not.toBeVisible();
    await expect(page.getByTestId('portfolio-group-HI_RISK')).not.toBeVisible();
    await expect(page.getByTestId('position-BTC')).toBeVisible();
    await expect(page.getByTestId('position-ETH')).toBeVisible();
  });

  test('Portfolio HI RISK filter shows only HI_RISK positions', async ({ page }) => {
    await loginAsUser(page);
    await page.getByTestId('nav-portfolio').click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible();
    await page.getByTestId('portfolio-filter-hi_risk').click();
    await expect(page.getByTestId('portfolio-group-HI_RISK')).toBeVisible();
    await expect(page.getByTestId('portfolio-group-HOLD')).not.toBeVisible();
    await expect(page.getByTestId('portfolio-group-ALTs')).not.toBeVisible();
    await expect(page.getByTestId('position-PEPE')).toBeVisible();
  });
});
