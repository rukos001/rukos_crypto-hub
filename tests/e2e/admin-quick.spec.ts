import { test, expect } from '@playwright/test';

const BASE_URL = 'https://market-dashboard-53.preview.emergentagent.com';

async function loginAsAdmin(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const loginBtn = page.getByRole('button', { name: /Войти|Login/i });
  await expect(loginBtn).toBeVisible();
  await loginBtn.click();
  await page.getByPlaceholder(/email/i).fill('admin@rukos.crypto');
  await page.getByPlaceholder(/password|пароль/i).fill('1661616irk');
  const submitBtn = page.getByRole('button', { name: /Войти|Login|Sign in/i }).last();
  await submitBtn.click();
  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 15000 });
}

test.describe('Admin Panel', () => {
  test('Admin login shows admin link in sidebar', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByTestId('sidebar')).toBeVisible();
    await expect(page.getByTestId('nav-admin')).toBeVisible();
  });

  test('Admin can access admin page sections', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible();
    await expect(page.getByTestId('admin-section-users')).toBeVisible();
    await expect(page.getByTestId('admin-section-chat')).toBeVisible();
    await expect(page.getByTestId('admin-section-stats')).toBeVisible();
  });

  test('Admin users list has password toggle', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByTestId('nav-admin').click();
    await expect(page.getByTestId('admin-page')).toBeVisible();
    await expect(page.locator('[data-testid^="admin-user-"]').first()).toBeVisible({ timeout: 10000 });
    const toggle = page.locator('[data-testid^="toggle-pwd-"]').first();
    await expect(toggle).toBeVisible();
    await toggle.click();
  });
});
