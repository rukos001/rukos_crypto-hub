import { Page, expect } from '@playwright/test';

export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
}

export async function dismissToasts(page: Page) {
  await page.addLocatorHandler(
    page.locator('[data-sonner-toast], .Toastify__toast, [role="status"].toast, .MuiSnackbar-root'),
    async () => {
      const close = page.locator('[data-sonner-toast] [data-close], [data-sonner-toast] button[aria-label="Close"], .Toastify__close-button, .MuiSnackbar-root button');
      await close.first().click({ timeout: 2000 }).catch(() => {});
    },
    { times: 10, noWaitAfter: true }
  );
}

export async function checkForErrors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const errorElements = Array.from(
      document.querySelectorAll('.error, [class*="error"], [id*="error"]')
    );
    return errorElements.map(el => el.textContent || '').filter(Boolean);
  });
}

export async function login(page: Page, email: string = 'test@test.com', password: string = 'password123') {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  
  // Click login button
  const loginBtn = page.getByRole('button', { name: /Войти|Login/i });
  await expect(loginBtn).toBeVisible();
  await loginBtn.click();
  
  // Fill login form
  await page.getByPlaceholder(/email/i).fill(email);
  await page.getByPlaceholder(/password|пароль/i).fill(password);
  
  // Submit login
  const submitBtn = page.getByRole('button', { name: /Войти|Login|Sign in/i }).last();
  await submitBtn.click();
  
  // Wait for dashboard to load
  await expect(page.getByTestId('dashboard-page')).toBeVisible({ timeout: 15000 });
}

export async function setLanguage(page: Page, lang: 'ru' | 'en') {
  // Click language switcher until we get the desired language
  const switcher = page.getByTestId('language-switcher');
  const currentLang = await switcher.textContent();
  if ((lang === 'ru' && currentLang?.includes('EN')) || (lang === 'en' && currentLang?.includes('RU'))) {
    await switcher.click();
  }
}

export async function removeEmergentBadge(page: Page) {
  await page.evaluate(() => {
    const badge = document.querySelector('[class*="emergent"], [id*="emergent-badge"]');
    if (badge) badge.remove();
  });
}
