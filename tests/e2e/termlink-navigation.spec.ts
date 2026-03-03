import { test, expect } from '@playwright/test';
import { loginAsAdmin, dismissToasts, removeEmergentBadge } from '../fixtures/helpers';

/**
 * TermLink Navigation Tests
 * Tests that clicking (?) icons next to terms navigates to correct knowledge base articles
 * 
 * Mappings from TermLink.js:
 * - fear & greed -> m3 (macro)
 * - dxy -> m1 (macro)
 * - m2 -> m1 (macro)
 * - stablecoin -> st1 (defi)
 * - aum -> etf1 (etf)
 * - inflow -> etf1 (etf)
 * - sopr -> on1 (onchain)
 * - nupl -> on2 (onchain)
 * - mvrv -> on3 (onchain)
 * - tvl -> d1 (defi)
 * - open interest -> p1 (perp)
 * - funding rate -> p2 (perp)
 * - liquidation -> p3 (perp)
 * - gamma -> o1 (options)
 * - max pain -> o3 (options)
 * - gamma flip -> o3 (options)
 */

test.describe('TermLink Navigation - Dashboard to Knowledge Base', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    await removeEmergentBadge(page);
  });

  test('Fear & Greed TermLink navigates to macro category with m3 article', async ({ page }) => {
    // Fear & Greed is on Market Core tab (main dashboard)
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    
    // Click the fear & greed TermLink
    const termLink = page.getByTestId('term-link-fear-&-greed');
    await expect(termLink).toBeVisible({ timeout: 10000 });
    await termLink.click();
    
    // Verify navigation to knowledge page with macro category
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    
    // Verify the m3 article is highlighted (expanded)
    await expect(page.getByTestId('article-m3')).toBeVisible({ timeout: 10000 });
    
    // Verify articles are in Russian
    await expect(page.getByText('Risk-On vs Risk-Off')).toBeVisible();
  });

  test('DXY TermLink navigates to macro category with m1 article', async ({ page }) => {
    // DXY is on Market Core tab in Traditional Markets section - appears twice, use first
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    
    const termLink = page.getByTestId('term-link-dxy').first();
    await expect(termLink).toBeVisible({ timeout: 10000 });
    await termLink.click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-m1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-m1').getByText('Макро-индикаторы для крипто')).toBeVisible();
  });

  test('M2 TermLink navigates to macro category with m1 article', async ({ page }) => {
    // M2 is on Market Core tab in Global Liquidity section
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    
    const termLink = page.getByTestId('term-link-m2');
    await expect(termLink).toBeVisible({ timeout: 10000 });
    await termLink.click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-m1')).toBeVisible({ timeout: 10000 });
  });

  test('Stablecoin TermLink navigates to defi category with st1 article', async ({ page }) => {
    // Stablecoin is on Market Core tab in Stablecoins section - appears twice, use first
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    
    const termLink = page.getByTestId('term-link-stablecoin').first();
    await expect(termLink).toBeVisible({ timeout: 10000 });
    await termLink.click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-st1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-st1').getByText('Стейблкоины: Гид')).toBeVisible();
  });

  test('Open Interest TermLink navigates to perp category with p1 article', async ({ page }) => {
    // Open Interest is on Derivatives tab
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    
    // Click Derivatives tab
    await page.getByTestId('tab-derivatives').click();
    await expect(page.getByTestId('derivatives-btc-btn')).toBeVisible({ timeout: 10000 });
    
    const termLink = page.getByTestId('term-link-open-interest');
    await expect(termLink).toBeVisible({ timeout: 10000 });
    await termLink.click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-p1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Основы бессрочных фьючерсов')).toBeVisible();
  });

  test('Gamma TermLink navigates to options category with o1 article', async ({ page }) => {
    // Gamma is on Derivatives tab in Gamma Exposure section
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    
    // Click Derivatives tab
    await page.getByTestId('tab-derivatives').click();
    await expect(page.getByTestId('derivatives-btc-btn')).toBeVisible({ timeout: 10000 });
    
    const termLink = page.getByTestId('term-link-gamma');
    await expect(termLink).toBeVisible({ timeout: 10000 });
    await termLink.click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-o1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Основы опционов')).toBeVisible();
  });

  test('Max Pain TermLink navigates to options category with o3 article', async ({ page }) => {
    // Max Pain is on Derivatives tab in Gamma Exposure section
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    
    // Click Derivatives tab
    await page.getByTestId('tab-derivatives').click();
    await expect(page.getByTestId('derivatives-btc-btn')).toBeVisible({ timeout: 10000 });
    
    const termLink = page.getByTestId('term-link-max-pain');
    await expect(termLink).toBeVisible({ timeout: 10000 });
    await termLink.click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-o3')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Max Pain и Гамма-экспозиция')).toBeVisible();
  });

  test('Gamma Flip TermLink navigates to options category with o3 article', async ({ page }) => {
    // Gamma Flip is on Derivatives tab in Gamma Exposure section
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    
    // Click Derivatives tab
    await page.getByTestId('tab-derivatives').click();
    await expect(page.getByTestId('derivatives-btc-btn')).toBeVisible({ timeout: 10000 });
    
    const termLink = page.getByTestId('term-link-gamma-flip');
    await expect(termLink).toBeVisible({ timeout: 10000 });
    await termLink.click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-o3')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('TermLink Navigation - ETF Tab', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    await removeEmergentBadge(page);
    
    // Navigate to ETF tab
    await page.getByTestId('tab-etf').click();
    await expect(page.getByTestId('etf-filter')).toBeVisible({ timeout: 10000 });
  });

  test('AUM TermLink navigates to etf category with etf1 article', async ({ page }) => {
    const termLink = page.getByTestId('term-link-aum');
    await expect(termLink).toBeVisible({ timeout: 10000 });
    await termLink.click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-etf1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Bitcoin ETF: Основы')).toBeVisible();
  });

  test('Inflow TermLink navigates to etf category with etf1 article', async ({ page }) => {
    const termLink = page.getByTestId('term-link-inflow');
    await expect(termLink).toBeVisible({ timeout: 10000 });
    await termLink.click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-etf1')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('TermLink Navigation - Onchain Tab', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    await removeEmergentBadge(page);
    
    // Navigate to Onchain tab
    await page.getByTestId('tab-onchain').click();
    await expect(page.getByTestId('onchain-chain-selector')).toBeVisible({ timeout: 10000 });
  });

  test('SOPR TermLink navigates to onchain category with on1 article', async ({ page }) => {
    const termLink = page.getByTestId('term-link-sopr');
    await expect(termLink).toBeVisible({ timeout: 10000 });
    await termLink.click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-on1')).toBeVisible({ timeout: 10000 });
    // Use exact article title match to avoid category description confusion
    await expect(page.getByTestId('article-on1').getByText('Ончейн-метрики: SOPR', { exact: true })).toBeVisible();
  });

  test('NUPL TermLink navigates to onchain category with on2 article', async ({ page }) => {
    const termLink = page.getByTestId('term-link-nupl');
    await expect(termLink).toBeVisible({ timeout: 10000 });
    await termLink.click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-on2')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Ончейн-метрики: NUPL')).toBeVisible();
  });

  test('MVRV TermLink navigates to onchain category with on3 article', async ({ page }) => {
    const termLink = page.getByTestId('term-link-mvrv');
    await expect(termLink).toBeVisible({ timeout: 10000 });
    await termLink.click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-on3')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Ончейн-метрики: MVRV')).toBeVisible();
  });
});

test.describe('TermLink Navigation - Altseason Tab', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    await removeEmergentBadge(page);
    
    // Navigate to Altseason tab
    await page.getByTestId('tab-altseason').click();
    await page.waitForLoadState('domcontentloaded');
  });

  test('TVL TermLink navigates to defi category with d1 article', async ({ page }) => {
    // TVL is on Altseason tab (DashboardTabs2.js line 650)
    const termLink = page.getByTestId('term-link-tvl').first();
    await expect(termLink).toBeVisible({ timeout: 10000 });
    await termLink.click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-d1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-d1').getByText('Что такое DeFi?')).toBeVisible();
  });
});

test.describe('Knowledge Base Article Display', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    await removeEmergentBadge(page);
  });

  test('Knowledge page displays all 6 category buttons', async ({ page }) => {
    // Navigate to knowledge page via sidebar
    await page.getByTestId('nav-knowledge-toggle').click();
    await page.getByTestId('nav-knowledge-defi').click();
    
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('knowledge-categories')).toBeVisible();
    
    // Verify all 6 categories
    await expect(page.getByTestId('knowledge-cat-defi')).toBeVisible();
    await expect(page.getByTestId('knowledge-cat-perp')).toBeVisible();
    await expect(page.getByTestId('knowledge-cat-options')).toBeVisible();
    await expect(page.getByTestId('knowledge-cat-macro')).toBeVisible();
    await expect(page.getByTestId('knowledge-cat-onchain')).toBeVisible();
    await expect(page.getByTestId('knowledge-cat-etf')).toBeVisible();
  });

  test('DeFi category shows 4 articles including st1', async ({ page }) => {
    await page.goto('/knowledge/defi', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    
    // Wait for articles to load
    await expect(page.getByTestId('article-d1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-d2')).toBeVisible();
    await expect(page.getByTestId('article-d3')).toBeVisible();
    await expect(page.getByTestId('article-st1')).toBeVisible();
  });

  test('Macro category shows 4 articles', async ({ page }) => {
    await page.goto('/knowledge/macro', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    
    await expect(page.getByTestId('article-m1')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-m2')).toBeVisible();
    await expect(page.getByTestId('article-m3')).toBeVisible();
    await expect(page.getByTestId('article-alt1')).toBeVisible();
  });

  test('Articles are displayed in Russian', async ({ page }) => {
    await page.goto('/knowledge/defi', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('knowledge-page')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('article-d1')).toBeVisible({ timeout: 10000 });
    
    // Check for Russian title (inside article card to be specific)
    await expect(page.getByTestId('article-d1').getByText('Что такое DeFi?')).toBeVisible();
    
    // Check header is in Russian (use knowledge page specific locator)
    await expect(page.getByTestId('knowledge-page').getByRole('heading', { name: 'База знаний' })).toBeVisible();
  });
});
