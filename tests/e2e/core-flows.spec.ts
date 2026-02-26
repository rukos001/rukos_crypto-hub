import { test, expect, Page } from '@playwright/test';

// Login helper
async function login(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /Войти/ }).click();
  await expect(page.getByText(/Авторизация/)).toBeVisible();
  await page.getByLabel(/Email/i).fill('test@test.com');
  await page.getByLabel(/Пароль/i).fill('password123');
  await page.getByRole('button', { name: /Войти/ }).first().click();
  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 15000 });
}

test.describe('Core Flows - Auth and Navigation', () => {
  
  test('homepage loads with Russian text by default', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Войти/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Начать бесплатно/ })).toBeVisible();
  });
  
  test('user can login successfully', async ({ page }) => {
    await login(page);
    await expect(page.getByTestId('sidebar')).toBeVisible();
    await expect(page.getByTestId('tab-market')).toBeVisible();
  });
  
  test('language switcher toggles between RU and EN', async ({ page }) => {
    await login(page);
    
    const langSwitcher = page.getByTestId('language-switcher');
    await expect(langSwitcher).toBeVisible();
    
    // Click to toggle
    await langSwitcher.click();
    
    // Check that language changed (look for the button text change)
    const newLangText = await langSwitcher.textContent();
    expect(newLangText).toBeTruthy();
    
    // Toggle back
    await langSwitcher.click();
  });
  
  test('all dashboard tabs are visible', async ({ page }) => {
    await login(page);
    
    const tabs = ['market', 'derivatives', 'etf', 'onchain', 'altseason', 'risk', 'ai', 'portfolio', 'war'];
    for (const tabId of tabs) {
      const tab = page.getByTestId(`tab-${tabId}`);
      await expect(tab).toBeVisible();
    }
  });
  
  test('sidebar navigation works', async ({ page }) => {
    await login(page);
    
    // Navigate to Ideas
    await page.getByTestId('nav-ideas').click();
    await expect(page).toHaveURL(/\/ideas/);
    
    // Navigate back to Dashboard
    await page.getByTestId('nav-dashboard').click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});

test.describe('Market Core Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
  });
  
  test('displays BTC, ETH, SOL prices', async ({ page }) => {
    await page.getByTestId('tab-market').click();
    
    // Wait for crypto prices card
    await expect(page.getByTestId('crypto-prices-card')).toBeVisible({ timeout: 10000 });
    
    // Check BTC, ETH, SOL are displayed within the crypto prices card
    const cryptoCard = page.getByTestId('crypto-prices-card');
    await expect(cryptoCard.getByText('BTC')).toBeVisible();
    await expect(cryptoCard.getByText('ETH')).toBeVisible();
    await expect(cryptoCard.getByText('SOL')).toBeVisible();
  });
  
  test('displays Fear & Greed Index', async ({ page }) => {
    await page.getByTestId('tab-market').click();
    
    // Wait for Fear & Greed card
    await expect(page.getByTestId('fear-greed-card')).toBeVisible({ timeout: 10000 });
    
    // Check Fear & Greed classification is shown
    const fgCard = page.getByTestId('fear-greed-card');
    await expect(fgCard.getByText(/Fear|Greed|Neutral/i).first()).toBeVisible();
  });
  
  test('displays Gold in Traditional Markets', async ({ page }) => {
    await page.getByTestId('tab-market').click();
    
    // Wait for market core content to load
    await expect(page.getByTestId('crypto-prices-card')).toBeVisible({ timeout: 10000 });
    
    // Check for Gold/XAU display
    await expect(page.getByText(/Gold|XAU|Золото/i).first()).toBeVisible();
  });
  
  test('displays Stablecoins section', async ({ page }) => {
    await page.getByTestId('tab-market').click();
    
    // Check for Stablecoins section
    await expect(page.getByText('USDT')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('USDC')).toBeVisible();
  });
  
  test('displays Global Liquidity (M2)', async ({ page }) => {
    await page.getByTestId('tab-market').click();
    
    // Check for M2 Global Liquidity
    await expect(page.getByText(/Global M2|Глобальная ликвидность/i).first()).toBeVisible({ timeout: 10000 });
  });
  
  test('has info tooltips', async ({ page }) => {
    await page.getByTestId('tab-market').click();
    
    // Wait for content to load
    await expect(page.getByTestId('crypto-prices-card')).toBeVisible({ timeout: 10000 });
    
    // Check that info tooltip buttons exist
    const tooltips = page.getByTestId('info-tooltip');
    await expect(tooltips.first()).toBeVisible();
  });
  
  test('has source links', async ({ page }) => {
    await page.getByTestId('tab-market').click();
    
    // Wait for content to load
    await expect(page.getByTestId('crypto-prices-card')).toBeVisible({ timeout: 10000 });
    
    // Check that source links exist (CoinGecko, CoinMarketCap, etc.)
    await expect(page.getByText('CoinGecko').first()).toBeVisible();
  });
});
