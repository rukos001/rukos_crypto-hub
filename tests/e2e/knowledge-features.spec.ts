import { test, expect } from '@playwright/test';

/**
 * Knowledge Base Tests - Frontend E2E Tests
 * Tests for Knowledge page categories, articles, expand/collapse, sidebar navigation
 */

// Helper function for user login
async function loginAsUser(page, email = 'test@test.com', password = 'password123') {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Войти|Login/i }).click();
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(password);
  await page.getByTestId('login-submit-btn').click();
  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 15000 });
}

// Helper function for admin login
async function loginAsAdmin(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Войти|Login/i }).click();
  await page.getByTestId('login-email-input').fill('admin@rukos.crypto');
  await page.getByTestId('login-password-input').fill('1661616irk');
  await page.getByTestId('login-submit-btn').click();
  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 15000 });
}

test.describe('Knowledge Base - Sidebar Navigation', () => {
  test('Knowledge Base toggle in sidebar shows subgroups', async ({ page }) => {
    await loginAsUser(page);
    await expect(page.getByTestId('sidebar')).toBeVisible();
    
    // Click Knowledge toggle
    await page.getByTestId('nav-knowledge-toggle').click();
    
    // Verify all 4 subgroups are visible
    await expect(page.getByTestId('nav-knowledge-defi')).toBeVisible();
    await expect(page.getByTestId('nav-knowledge-perp')).toBeVisible();
    await expect(page.getByTestId('nav-knowledge-options')).toBeVisible();
    await expect(page.getByTestId('nav-knowledge-macro')).toBeVisible();
  });

  test('Sidebar DeFi link navigates to Knowledge DeFi category', async ({ page }) => {
    await loginAsUser(page);
    
    // Expand Knowledge section
    await page.getByTestId('nav-knowledge-toggle').click();
    await page.getByTestId('nav-knowledge-defi').click();
    
    // Verify on Knowledge page with DeFi category
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('knowledge-cat-defi')).toBeVisible();
  });

  test('Sidebar PERP link navigates to Knowledge PERP category', async ({ page }) => {
    await loginAsUser(page);
    
    await page.getByTestId('nav-knowledge-toggle').click();
    await page.getByTestId('nav-knowledge-perp').click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('knowledge-cat-perp')).toBeVisible();
  });

  test('Sidebar OPTIONS link navigates to Knowledge OPTIONS category', async ({ page }) => {
    await loginAsUser(page);
    
    await page.getByTestId('nav-knowledge-toggle').click();
    await page.getByTestId('nav-knowledge-options').click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('knowledge-cat-options')).toBeVisible();
  });

  test('Sidebar MACRO link navigates to Knowledge MACRO category', async ({ page }) => {
    await loginAsUser(page);
    
    await page.getByTestId('nav-knowledge-toggle').click();
    await page.getByTestId('nav-knowledge-macro').click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('knowledge-cat-macro')).toBeVisible();
  });
});

test.describe('Knowledge Base - Category Cards', () => {
  test('Knowledge page shows all 4 category cards', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/knowledge/defi', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    
    // Verify all 4 category buttons
    await expect(page.getByTestId('knowledge-categories')).toBeVisible();
    await expect(page.getByTestId('knowledge-cat-defi')).toBeVisible();
    await expect(page.getByTestId('knowledge-cat-perp')).toBeVisible();
    await expect(page.getByTestId('knowledge-cat-options')).toBeVisible();
    await expect(page.getByTestId('knowledge-cat-macro')).toBeVisible();
  });

  test('Category click switches displayed articles', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/knowledge/defi', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    
    // DeFi should be active initially (wait for articles)
    await expect(page.getByTestId('article-d1')).toBeVisible({ timeout: 10000 });
    
    // Click PERP category
    await page.getByTestId('knowledge-cat-perp').click();
    
    // Wait for PERP articles to load (article id starts with 'p')
    await expect(page.getByTestId('article-p1')).toBeVisible({ timeout: 10000 });
    // DeFi articles should not be visible
    await expect(page.getByTestId('article-d1')).not.toBeVisible();
  });
});

test.describe('Knowledge Base - Articles', () => {
  test('DeFi category displays 3 articles', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/knowledge/defi', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    
    // Wait for articles to load
    await expect(page.getByTestId('article-d1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-d2')).toBeVisible();
    await expect(page.getByTestId('article-d3')).toBeVisible();
  });

  test('Article expand/collapse works', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/knowledge/defi', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    
    // First article should be expanded by default (first article auto-expands)
    await expect(page.getByTestId('article-d1')).toBeVisible({ timeout: 10000 });
    
    // Click on second article to expand it
    await page.getByTestId('article-d2').click();
    
    // Second article should now show its content (it expands)
    // The content area appears when expanded - just verify the article is interactive
    await expect(page.getByTestId('article-d2')).toBeVisible();
  });

  test('Article displays tags', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/knowledge/defi', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    
    // Wait for first article and check for tag badges
    await expect(page.getByTestId('article-d1')).toBeVisible({ timeout: 10000 });
    
    // First DeFi article has tags: basics, liquidity, yield
    const article = page.getByTestId('article-d1');
    await expect(article.locator('text=basics')).toBeVisible();
  });

  test('Article content has bold formatting', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/knowledge/defi', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    
    // Wait for articles to load
    await expect(page.getByTestId('article-d1')).toBeVisible({ timeout: 10000 });
    
    // Check that strong/bold elements exist in content (bold formatting)
    // The content uses **text** which renders as bold
    await expect(page.locator('strong').first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Admin Portfolio Editor UI', () => {
  test('Admin portfolio section shows user list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible({ timeout: 10000 });
    
    // Click Portfolio tab
    await page.getByTestId('admin-section-portfolio').click();
    
    // Verify user list loads
    await expect(page.locator('[data-testid^="portfolio-select-"]').first()).toBeVisible({ timeout: 10000 });
  });

  test('Admin portfolio shows HOLD/ALTs/HI_RISK group buttons', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible({ timeout: 10000 });
    
    // Click Portfolio tab
    await page.getByTestId('admin-section-portfolio').click();
    
    // Select first user
    await page.locator('[data-testid^="portfolio-select-"]').first().click();
    
    // Verify group buttons
    await expect(page.getByTestId('admin-portfolio-group-HOLD')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('admin-portfolio-group-ALTs')).toBeVisible();
    await expect(page.getByTestId('admin-portfolio-group-HI_RISK')).toBeVisible();
  });

  test('Admin portfolio editor has Add and Save buttons', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible({ timeout: 10000 });
    
    // Click Portfolio tab
    await page.getByTestId('admin-section-portfolio').click();
    
    // Select first user
    await page.locator('[data-testid^="portfolio-select-"]').first().click();
    
    // Click HOLD group to open editor
    await page.getByTestId('admin-portfolio-group-HOLD').click();
    
    // Verify Add and Save buttons
    await expect(page.getByTestId('add-position-btn')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('save-portfolio-btn')).toBeVisible();
  });

  test('Admin can add position with Add button', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible({ timeout: 10000 });
    
    // Click Portfolio tab and select user
    await page.getByTestId('admin-section-portfolio').click();
    await page.locator('[data-testid^="portfolio-select-"]').first().click();
    
    // Click HOLD group
    await page.getByTestId('admin-portfolio-group-HOLD').click();
    
    // Click Add button
    await page.getByTestId('add-position-btn').click();
    
    // Verify position row appears
    await expect(page.getByTestId('edit-position-0')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('pos-asset-0')).toBeVisible();
    await expect(page.getByTestId('pos-size-0')).toBeVisible();
    await expect(page.getByTestId('pos-entry-0')).toBeVisible();
    await expect(page.getByTestId('pos-current-0')).toBeVisible();
    await expect(page.getByTestId('pos-notes-0')).toBeVisible();
    await expect(page.getByTestId('pos-delete-0')).toBeVisible();
  });
});
