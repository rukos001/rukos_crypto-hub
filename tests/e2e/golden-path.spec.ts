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

test.describe('Golden Path - Complete User Journey', () => {
  
  test('complete dashboard experience in Russian', async ({ page }) => {
    // Step 1: Load homepage (Russian by default)
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Войти/ })).toBeVisible();
    
    // Step 2: Login
    await login(page);
    
    // Step 3: Verify dashboard loads with Market Core tab
    await expect(page.getByTestId('tab-market')).toHaveAttribute('data-state', 'active');
    await expect(page.getByTestId('crypto-prices-card')).toBeVisible({ timeout: 10000 });
    
    // Step 4: Verify BTC/ETH/SOL prices and Fear & Greed
    const cryptoCard = page.getByTestId('crypto-prices-card');
    await expect(cryptoCard.getByText('BTC', { exact: true })).toBeVisible();
    await expect(page.getByTestId('fear-greed-card')).toBeVisible();
    
    // Step 5: Switch to ETF tab and test filters
    await page.getByTestId('tab-etf').click();
    await expect(page.getByTestId('etf-filter')).toBeVisible({ timeout: 10000 });
    
    // Test filter buttons
    await page.getByTestId('etf-filter-btc').click();
    await page.getByTestId('etf-filter-eth').click();
    await page.getByTestId('etf-filter-all').click();
    
    // Step 6: Switch to Onchain tab and test chain selector
    await page.getByTestId('tab-onchain').click();
    await expect(page.getByTestId('onchain-chain-selector')).toBeVisible({ timeout: 10000 });
    
    // Test chain selector
    await page.getByTestId('onchain-eth-btn').click();
    await expect(page.getByText(/Staking/i).first()).toBeVisible({ timeout: 5000 });
    
    await page.getByTestId('onchain-sol-btn').click();
    await expect(page.getByText(/Staking/i).first()).toBeVisible({ timeout: 5000 });
    
    await page.getByTestId('onchain-btc-btn').click();
    await expect(page.getByText(/Miner|Резервы майнеров/i).first()).toBeVisible({ timeout: 5000 });
    
    // Step 7: Test language switcher
    const langSwitcher = page.getByTestId('language-switcher');
    await langSwitcher.click();
    
    // Wait for language to change and verify
    await page.waitForTimeout(300);
    
    // Toggle back
    await langSwitcher.click();
    
    // Step 8: Test refresh button
    await page.getByTestId('refresh-btn').click();
    
    // Step 9: Navigate through other tabs
    await page.getByTestId('tab-derivatives').click();
    await expect(page.getByText(/Open Interest/i).first()).toBeVisible({ timeout: 10000 });
    
    await page.getByTestId('tab-altseason').click();
    await expect(page.getByText(/Altseason|ALTSEASON|альтсезон/i).first()).toBeVisible({ timeout: 10000 });
    
    await page.getByTestId('tab-risk').click();
    await expect(page.getByText(/Risk Score|Risk Engine/i).first()).toBeVisible({ timeout: 10000 });
    
    await page.getByTestId('tab-ai').click();
    await expect(page.getByText(/Signal|BULLISH|BEARISH|NEUTRAL/i).first()).toBeVisible({ timeout: 10000 });
    
    await page.getByTestId('tab-war').click();
    await expect(page.getByText(/Stress|STRESS|стресс/i).first()).toBeVisible({ timeout: 10000 });
    
    // Step 10: Return to Market Core
    await page.getByTestId('tab-market').click();
    await expect(page.getByTestId('crypto-prices-card')).toBeVisible();
    
    // Take final screenshot
    await page.screenshot({ path: 'golden-path-complete.jpeg', quality: 20 });
  });
});
