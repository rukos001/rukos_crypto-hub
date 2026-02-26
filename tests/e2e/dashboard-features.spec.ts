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

test.describe('ETF Intelligence Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByTestId('tab-etf').click();
    await expect(page.getByTestId('etf-filter')).toBeVisible({ timeout: 10000 });
  });
  
  test('displays ETF filter buttons (All/BTC/ETH)', async ({ page }) => {
    const filterAll = page.getByTestId('etf-filter-all');
    const filterBtc = page.getByTestId('etf-filter-btc');
    const filterEth = page.getByTestId('etf-filter-eth');
    
    await expect(filterAll).toBeVisible();
    await expect(filterBtc).toBeVisible();
    await expect(filterEth).toBeVisible();
  });
  
  test('All filter shows all ETF funds', async ({ page }) => {
    await page.getByTestId('etf-filter-all').click();
    
    // Should show multiple fund tickers
    await expect(page.getByText(/IBIT|FBTC|GBTC|ARKB/i).first()).toBeVisible();
    await expect(page.getByText(/ETHA|FETH|ETHE/i).first()).toBeVisible();
  });
  
  test('BTC filter shows only BTC ETF funds', async ({ page }) => {
    await page.getByTestId('etf-filter-btc').click();
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Should show BTC ETF tickers
    await expect(page.getByText(/IBIT|FBTC|GBTC|ARKB/i).first()).toBeVisible();
  });
  
  test('ETH filter shows only ETH ETF funds', async ({ page }) => {
    await page.getByTestId('etf-filter-eth').click();
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Should show ETH ETF tickers
    await expect(page.getByText(/ETHA|FETH|ETHE/i).first()).toBeVisible();
  });
  
  test('displays Total AUM', async ({ page }) => {
    // AUM should be displayed (in billions)
    await expect(page.getByText(/\$\d+(\.\d+)?[TB]/i).first()).toBeVisible();
  });
  
  test('displays Daily Flow', async ({ page }) => {
    // Daily flow should be displayed
    await expect(page.getByText(/Daily|Flow|Дневной/i).first()).toBeVisible();
  });
  
  test('has source links to SoSoValue', async ({ page }) => {
    await expect(page.getByText(/SoSoValue/i).first()).toBeVisible();
  });
});

test.describe('Onchain Tab', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.getByTestId('tab-onchain').click();
    await expect(page.getByTestId('onchain-chain-selector')).toBeVisible({ timeout: 10000 });
  });
  
  test('displays chain selector with BTC/ETH/SOL buttons', async ({ page }) => {
    const btcBtn = page.getByTestId('onchain-btc-btn');
    const ethBtn = page.getByTestId('onchain-eth-btn');
    const solBtn = page.getByTestId('onchain-sol-btn');
    
    await expect(btcBtn).toBeVisible();
    await expect(ethBtn).toBeVisible();
    await expect(solBtn).toBeVisible();
  });
  
  test('BTC chain shows BTC-specific data', async ({ page }) => {
    await page.getByTestId('onchain-btc-btn').click();
    
    // Wait for data to load
    await page.waitForTimeout(500);
    
    // Should show BTC metrics
    await expect(page.getByText(/SOPR|MVRV|NUPL/i).first()).toBeVisible();
    
    // BTC should show miner reserves
    await expect(page.getByText(/Miner|Reserves|Резервы майнеров/i).first()).toBeVisible();
  });
  
  test('ETH chain shows ETH-specific data with staking', async ({ page }) => {
    await page.getByTestId('onchain-eth-btn').click();
    
    // Wait for data to load
    await page.waitForTimeout(500);
    
    // Should show ETH and staking data
    await expect(page.getByText(/ETH/i).first()).toBeVisible();
    await expect(page.getByText(/Staking|Staked/i).first()).toBeVisible();
  });
  
  test('SOL chain shows SOL-specific data with staking', async ({ page }) => {
    await page.getByTestId('onchain-sol-btn').click();
    
    // Wait for data to load
    await page.waitForTimeout(500);
    
    // Should show SOL and staking data
    await expect(page.getByText(/SOL/i).first()).toBeVisible();
    await expect(page.getByText(/Staking|Staked/i).first()).toBeVisible();
  });
  
  test('displays onchain metrics (SOPR, MVRV, NUPL)', async ({ page }) => {
    // These metrics should be visible for any chain
    await expect(page.getByText(/SOPR/i).first()).toBeVisible();
    await expect(page.getByText(/MVRV/i).first()).toBeVisible();
    await expect(page.getByText(/NUPL/i).first()).toBeVisible();
  });
  
  test('has info tooltips for metrics', async ({ page }) => {
    // Check for info tooltip buttons
    const tooltips = page.getByTestId('info-tooltip');
    await expect(tooltips.first()).toBeVisible();
  });
  
  test('has source links to Glassnode', async ({ page }) => {
    await expect(page.getByText(/Glassnode/i).first()).toBeVisible();
  });
});
