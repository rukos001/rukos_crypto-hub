import { test, expect } from '@playwright/test';
import { login, dismissToasts, removeEmergentBadge } from '../fixtures/helpers';

test.describe('Core Flows - Auth, Language, Navigation', () => {
  
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
  });
  
  test('homepage loads with Russian text by default', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Check homepage shows Russian text
    await expect(page.getByText(/Все данные крипторынка|RUKOS_CRYPTO/)).toBeVisible();
    await expect(page.getByRole('button', { name: /Начать бесплатно/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Войти/ })).toBeVisible();
  });
  
  test('user can login with valid credentials', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Click login button
    await page.getByRole('button', { name: /Войти/ }).click();
    
    // Fill login form
    await page.getByPlaceholder(/email/i).fill('test@test.com');
    await page.getByPlaceholder(/password|пароль/i).fill('password123');
    
    // Submit login
    await page.getByRole('button', { name: /Войти|Login|Sign in/i }).last().click();
    
    // Wait for dashboard
    await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 15000 });
    
    // Verify user is on dashboard
    await expect(page.getByRole('heading', { name: /Дашборд|Dashboard/ })).toBeVisible();
  });
  
  test('language switcher toggles between RU and EN', async ({ page }) => {
    await login(page);
    await removeEmergentBadge(page);
    
    // Initially should show RU indicator
    const langSwitcher = page.getByTestId('language-switcher');
    await expect(langSwitcher).toBeVisible();
    
    // Get initial language
    const initialText = await langSwitcher.textContent();
    
    if (initialText?.includes('RU')) {
      // Switch to EN
      await langSwitcher.click();
      await expect(page.getByTestId('language-switcher')).toContainText('EN');
      
      // Dashboard title should now be English
      await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible();
      
      // Switch back to RU
      await langSwitcher.click();
      await expect(page.getByTestId('language-switcher')).toContainText('RU');
      await expect(page.getByRole('heading', { name: /Дашборд/ })).toBeVisible();
    } else {
      // Switch to RU
      await langSwitcher.click();
      await expect(page.getByTestId('language-switcher')).toContainText('RU');
      await expect(page.getByRole('heading', { name: /Дашборд/ })).toBeVisible();
    }
  });
  
  test('language preference persists after page reload', async ({ page }) => {
    await login(page);
    await removeEmergentBadge(page);
    
    // Set to English
    const langSwitcher = page.getByTestId('language-switcher');
    const text = await langSwitcher.textContent();
    if (text?.includes('RU')) {
      await langSwitcher.click();
    }
    
    // Verify English
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible();
    
    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });
    
    // Should still be English after reload
    await expect(page.getByRole('heading', { name: /Dashboard/ })).toBeVisible();
    await expect(page.getByTestId('language-switcher')).toContainText('EN');
  });
  
  test('all dashboard tabs are visible and clickable', async ({ page }) => {
    await login(page);
    await removeEmergentBadge(page);
    
    // All tabs should be visible
    const tabs = ['market', 'derivatives', 'etf', 'onchain', 'altseason', 'risk', 'ai', 'portfolio', 'war'];
    
    for (const tabId of tabs) {
      const tab = page.getByTestId(`tab-${tabId}`);
      await expect(tab).toBeVisible();
    }
    
    // Click on ETF tab and verify content loads
    await page.getByTestId('tab-etf').click();
    await expect(page.getByTestId('etf-filter')).toBeVisible({ timeout: 10000 });
    
    // Click on Onchain tab and verify chain selector
    await page.getByTestId('tab-onchain').click();
    await expect(page.getByTestId('onchain-chain-selector')).toBeVisible({ timeout: 10000 });
    
    // Click on Market Core tab
    await page.getByTestId('tab-market').click();
    await expect(page.getByTestId('crypto-prices-card')).toBeVisible({ timeout: 10000 });
  });
  
  test('sidebar navigation items work', async ({ page }) => {
    await login(page);
    await removeEmergentBadge(page);
    
    // Dashboard nav should be active
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    
    // Navigate to other pages
    await page.getByTestId('nav-ideas').click();
    await expect(page).toHaveURL(/\/ideas/);
    
    await page.getByTestId('nav-dashboard').click();
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
