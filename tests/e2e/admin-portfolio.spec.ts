import { test, expect } from '@playwright/test';

/**
 * Admin Panel and Portfolio Tests - Consolidated Spec
 * Tests for admin features, portfolio page, landing page branding
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

// ==================== LANDING PAGE BRANDING TESTS ====================

test.describe('Landing Page Branding', () => {
  test('Landing page has hero video element', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const heroVideo = page.getByTestId('hero-video');
    await expect(heroVideo).toBeVisible();
    // Check video source is hero-video.mp4
    const source = heroVideo.locator('source');
    await expect(source).toHaveAttribute('src', '/hero-video.mp4');
    await expect(source).toHaveAttribute('type', 'video/mp4');
  });

  test('Landing page has logo image in hero', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const heroLogoImg = page.getByTestId('hero-logo-img');
    await expect(heroLogoImg).toBeVisible();
    await expect(heroLogoImg).toHaveAttribute('src', '/logo.jpg');
    await expect(heroLogoImg).toHaveAttribute('alt', 'RUKOS CRYPTO');
  });

  test('Landing page has RukosWatermark component', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Check for at least one watermark on landing page
    const watermarks = page.locator('[data-testid="rukos-watermark"]');
    const count = await watermarks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Landing page buttons visible and clickable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('get-started-btn')).toBeVisible();
    await expect(page.getByTestId('login-btn')).toBeVisible();
  });
});

// ==================== SIDEBAR BRANDING TESTS ====================

test.describe('Sidebar Logo', () => {
  test('Sidebar shows logo image when expanded', async ({ page }) => {
    await loginAsUser(page);
    await expect(page.getByTestId('sidebar')).toBeVisible();
    const sidebarLogo = page.getByTestId('sidebar-logo');
    await expect(sidebarLogo).toBeVisible();
    await expect(sidebarLogo).toHaveAttribute('src', '/logo.jpg');
  });
});

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
    // HOLD group is visible - positions may or may not exist depending on admin data
    const holdGroup = page.getByTestId('portfolio-group-HOLD');
    await expect(holdGroup).toBeVisible();
  });

  test('Portfolio HI RISK filter shows only HI_RISK positions', async ({ page }) => {
    await loginAsUser(page);
    await page.getByTestId('nav-portfolio').click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible();
    await page.getByTestId('portfolio-filter-hi_risk').click();
    await expect(page.getByTestId('portfolio-group-HI_RISK')).toBeVisible();
    await expect(page.getByTestId('portfolio-group-HOLD')).not.toBeVisible();
    await expect(page.getByTestId('portfolio-group-ALTs')).not.toBeVisible();
    // HI_RISK group is visible - positions may or may not exist depending on admin data
    const hiRiskGroup = page.getByTestId('portfolio-group-HI_RISK');
    await expect(hiRiskGroup).toBeVisible();
  });
});

// ==================== ADMIN PORTFOLIO EDITOR - APPLY TO ALL ====================

test.describe('Admin Portfolio - Apply to All Users', () => {
  test('Admin portfolio section has Apply to All toggle', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible();
    
    // Click portfolio section
    await page.getByTestId('admin-section-portfolio').click();
    
    // Check for Apply to All toggle
    const applyToggle = page.getByTestId('apply-to-all-toggle');
    await expect(applyToggle).toBeVisible();
  });

  test('Admin can toggle Apply to All mode', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible();
    
    await page.getByTestId('admin-section-portfolio').click();
    
    const applyToggle = page.getByTestId('apply-to-all-toggle');
    await expect(applyToggle).toBeVisible();
    
    // Click to enable Apply to All
    await applyToggle.click();
    
    // When Apply to All is active, should see "ALL USERS (N)" header with user count
    await expect(page.locator('span.text-\\[\\#F7931A\\]').filter({ hasText: /ALL USERS/ })).toBeVisible({ timeout: 5000 });
  });

  test('Admin can select group when Apply to All is enabled', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible();
    
    await page.getByTestId('admin-section-portfolio').click();
    
    // Enable Apply to All
    await page.getByTestId('apply-to-all-toggle').click();
    // Check for the "ALL USERS (N)" header
    await expect(page.locator('span.text-\\[\\#F7931A\\]').filter({ hasText: /ALL USERS/ })).toBeVisible();
    
    // Group buttons should be visible
    await expect(page.getByTestId('admin-portfolio-group-HOLD')).toBeVisible();
    await expect(page.getByTestId('admin-portfolio-group-ALTs')).toBeVisible();
    await expect(page.getByTestId('admin-portfolio-group-HI_RISK')).toBeVisible();
    
    // Click HOLD group
    await page.getByTestId('admin-portfolio-group-HOLD').click();
    
    // Position editor should appear with Add and Save buttons
    await expect(page.getByTestId('add-position-btn')).toBeVisible();
    await expect(page.getByTestId('save-portfolio-btn')).toBeVisible();
  });
});

// ==================== WATERMARK TESTS ====================

test.describe('RukosWatermark Components', () => {
  test('Dashboard page has watermarks', async ({ page }) => {
    await loginAsUser(page);
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    const watermarks = page.locator('[data-testid="rukos-watermark"]');
    const count = await watermarks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Portfolio page has watermarks', async ({ page }) => {
    await loginAsUser(page);
    await page.getByTestId('nav-portfolio').click();
    await expect(page.getByTestId('portfolio-page')).toBeVisible();
    const watermarks = page.locator('[data-testid="rukos-watermark"]');
    const count = await watermarks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('Admin page has watermarks', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible();
    const watermarks = page.locator('[data-testid="rukos-watermark"]');
    const count = await watermarks.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
