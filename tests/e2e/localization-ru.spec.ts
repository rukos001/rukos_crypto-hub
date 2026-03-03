import { test, expect, Page } from '@playwright/test';
import { loginAsAdmin, dismissToasts, removeEmergentBadge } from '../fixtures/helpers';

test.describe('Russian Localization Tests', () => {
  test.beforeEach(async ({ page }) => {
    await dismissToasts(page);
    await loginAsAdmin(page);
    await removeEmergentBadge(page);
  });

  test('Market Core tab - check Russian text visible', async ({ page }) => {
    // Default tab is Market Core - just verify we're on dashboard
    await expect(page.getByText('Цены криптовалют').first()).toBeVisible();
    await expect(page.getByText('Индекс страха и жадности').first()).toBeVisible();
    await expect(page.getByText('ОБЩАЯ КАПИТАЛИЗАЦИЯ').first()).toBeVisible();
  });

  test('Derivatives tab - check Russian labels', async ({ page }) => {
    await page.click('text=Деривативы');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Check key Russian elements
    await expect(page.getByText('СТАВКА ФАНДИНГА').first()).toBeVisible();
    await expect(page.getByText('СООТН. ЛОНГ/ШОРТ').first()).toBeVisible();
    await expect(page.getByText('История ставки фандинга').first()).toBeVisible();
    
    // Check status badges are translated
    const fundingStatusBadge = page.locator('text=НОРМАЛЬНЫЙ').or(page.locator('text=ВЫСОКИЙ')).or(page.locator('text=НИЗКИЙ')).first();
    await expect(fundingStatusBadge).toBeVisible({ timeout: 10000 });
  });

  test('Risk Engine tab - check translated risk levels', async ({ page }) => {
    await page.click('text=Риск-движок');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Check key Russian elements
    await expect(page.getByText('ИНДЕКС РИСКА').first()).toBeVisible();
    
    // Check risk level badge is translated
    const riskLevelBadge = page.locator('text=НИЗКИЙ').or(page.locator('text=СРЕДНИЙ')).or(page.locator('text=ВЫСОКИЙ')).or(page.locator('text=ЭКСТРЕМАЛЬНЫЙ')).first();
    await expect(riskLevelBadge).toBeVisible({ timeout: 10000 });
    
    // Check alert type badges are translated (if any alerts exist)
    const alertSection = page.getByText('Сигналы перегрева').first();
    if (await alertSection.isVisible().catch(() => false)) {
      // Look for any translated alert badge - could be OI ДИВЕРГЕНЦИЯ, СКАЧОК ФАНДИНГА, etc.
      const translatedAlert = page.locator('text=СКАЧОК ФАНДИНГА')
        .or(page.locator('text=ДВИЖЕНИЕ КИТОВ'))
        .or(page.locator('text=OI ДИВЕРГЕНЦИЯ'))
        .or(page.locator('text=ЛИКВИДАЦИЯ')).first();
      await expect(translatedAlert).toBeVisible();
    }
  });

  test('Risk Engine tab - FAIL: English text in radar chart labels', async ({ page }) => {
    await page.click('text=Риск-движок');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    const pageContent = await page.content();
    
    // These labels should be in Russian but are currently in English
    const englishLabels = ['FUNDING HEAT', 'VOLATILITY', 'LEVERAGE CROWDING', 'STABLECOIN FLOW', 'EXCHANGE RESERVE'];
    const foundEnglishLabels: string[] = [];
    
    for (const label of englishLabels) {
      if (pageContent.includes(label)) {
        foundEnglishLabels.push(label);
      }
    }
    
    // This test documents the issue - expect NO English labels
    expect(foundEnglishLabels.length, `Found English labels in radar chart: ${foundEnglishLabels.join(', ')}`).toBe(0);
  });

  test('Risk Engine tab - FAIL: English text in alert messages', async ({ page }) => {
    await page.click('text=Риск-движок');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    const pageContent = await page.content();
    
    // These alert messages should be in Russian but are currently in English
    const englishMessages = [
      'while price flat',
      'market overheated',
      'Funding rate at',
      'OI up'
    ];
    const foundEnglishMessages: string[] = [];
    
    for (const msg of englishMessages) {
      if (pageContent.includes(msg)) {
        foundEnglishMessages.push(msg);
      }
    }
    
    // This test documents the issue - expect NO English messages
    expect(foundEnglishMessages.length, `Found English alert messages: ${foundEnglishMessages.join(', ')}`).toBe(0);
  });

  test('AI Signals tab - check translated signal labels', async ({ page }) => {
    await page.click('text=AI Сигналы');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Check key Russian elements
    await expect(page.getByText('КОМПОЗИТНЫЙ СИГНАЛ').first()).toBeVisible();
    
    // Signal direction should be translated
    const signalBadge = page.locator('text=НЕЙТРАЛЬНЫЙ').or(page.locator('text=БЫЧИЙ')).or(page.locator('text=МЕДВЕЖИЙ')).first();
    await expect(signalBadge).toBeVisible();
    
    // Check squeeze probability section
    await expect(page.getByText('Вероятность сквиза').first()).toBeVisible();
  });

  test('AI Signals tab - FAIL: English text in chart axis labels', async ({ page }) => {
    await page.click('text=AI Сигналы');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    const pageContent = await page.content();
    
    // These axis labels should be in Russian but are currently in English
    const englishLabels = ['ONCHAIN', 'DERIVATIVES', 'ETF_FLOW', 'MACRO', 'SENTIMENT'];
    const foundEnglishLabels: string[] = [];
    
    for (const label of englishLabels) {
      if (pageContent.includes(label)) {
        foundEnglishLabels.push(label);
      }
    }
    
    // This test documents the issue - expect NO English labels
    expect(foundEnglishLabels.length, `Found English labels in AI Signals chart: ${foundEnglishLabels.join(', ')}`).toBe(0);
  });

  test('War Mode tab - FAIL: English alert messages', async ({ page }) => {
    await page.click('text=Режим войны');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Check key Russian elements are present
    await expect(page.getByText('УРОВЕНЬ СТРЕССА').first()).toBeVisible();
    await expect(page.getByText('Активные алерты').first()).toBeVisible();
    
    const pageContent = await page.content();
    
    // These messages should be in Russian but are currently in English
    const englishMessages = [
      'Normal operations',
      'Extreme funding rate detected',
      'Consider counter-trading the crowd',
      'Large whale transaction detected',
      'Monitor exchange flows'
    ];
    
    const foundEnglishMessages: string[] = [];
    for (const msg of englishMessages) {
      if (pageContent.includes(msg)) {
        foundEnglishMessages.push(msg);
      }
    }
    
    // This test documents the issue - expect NO English messages
    expect(foundEnglishMessages.length, `Found English messages: ${foundEnglishMessages.join(', ')}`).toBe(0);
  });

  test('War Mode tab - check translated stress level and actions', async ({ page }) => {
    await page.click('text=Режим войны');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Check stress level badge is translated
    const stressLevelBadge = page.locator('text=НОРМАЛЬНЫЙ').or(page.locator('text=ПОВЫШЕННЫЙ')).or(page.locator('text=ВЫСОКИЙ')).or(page.locator('text=КРИТИЧЕСКИЙ')).first();
    await expect(stressLevelBadge).toBeVisible();
    
    // Check quick action buttons are in Russian
    await expect(page.getByText('Сократить всё')).toBeVisible();
    await expect(page.getByText('Добавить хедж')).toBeVisible();
    await expect(page.getByText('Поставить стопы')).toBeVisible();
    await expect(page.getByText('В стейблы')).toBeVisible();
  });

  test('Onchain tab - FAIL: English status PROFIT_TAKING', async ({ page }) => {
    await page.click('text=Ончейн');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Check page loaded
    await expect(page.getByText('Потоки на биржи').first()).toBeVisible();
    
    const pageContent = await page.content();
    
    // Check if PROFIT_TAKING status is present (should be translated)
    const hasEnglishStatus = pageContent.includes('PROFIT_TAKING') || 
                            pageContent.includes('PROFIT_LOSS') ||
                            pageContent.includes('BREAK_EVEN');
    
    // This test documents the issue - expect NO English statuses
    expect(hasEnglishStatus, 'Found English SOPR status - should be translated to Russian').toBe(false);
  });

  test('ETF Analytics tab - FAIL: English ABSORBING status', async ({ page }) => {
    await page.click('text=ETF Аналитика');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Check key Russian elements
    await expect(page.getByText('ETF Абсорбция').first()).toBeVisible();
    await expect(page.getByText('Всего AUM')).toBeVisible();
    
    const pageContent = await page.content();
    
    // Check if English ABSORBING status badge is present
    // Note: The badge shows "ABSORBING (1.13x)" - "ABSORBING" part should be translated
    const hasEnglishStatus = pageContent.includes('ABSORBING') && 
                            !pageContent.includes('NOT_ABSORBING'); // NOT_ABSORBING would be separate
    
    // This test documents the issue - the status badge text should be in Russian
    if (hasEnglishStatus) {
      // Check if it's specifically in a badge context
      const absorbingBadge = await page.locator('text=/ABSORBING.*x\\)/').count();
      expect(absorbingBadge, 'Found English ABSORBING status badge - should be translated to Russian (e.g., ПОГЛОЩЕНИЕ)').toBe(0);
    }
  });

  test('Altseason tab - check Russian text present', async ({ page }) => {
    await page.click('text=Альтсезон');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Check key Russian elements
    await expect(page.getByText('ВЕРОЯТНОСТЬ АЛЬТСЕЗОНА').first()).toBeVisible();
    await expect(page.getByText('Распределение доминирования').first()).toBeVisible();
  });

  test('Altseason tab - FAIL: English "Other" in dominance chart', async ({ page }) => {
    await page.click('text=Альтсезон');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    const pageContent = await page.content();
    
    // Check for exact "Other" text that should be "Другие"
    // Looking for patterns like "> Other <" or "Other 31.4%"
    const otherPattern = />\s*Other\s*</i;
    const hasEnglishOther = otherPattern.test(pageContent);
    
    expect(hasEnglishOther, 'Found English "Other" text - should be "Другие"').toBe(false);
  });

  test('Portfolio page - check Russian labels', async ({ page }) => {
    await page.click('text=Портфель');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Check tab buttons
    await expect(page.getByTestId('tab-my-portfolio')).toBeVisible();
    
    // Check labels
    await expect(page.getByText('Прибыль/Убыток').first()).toBeVisible();
    await expect(page.getByText('Позиции').first()).toBeVisible();
  });

  test('Predictions tab - check Russian interface labels', async ({ page }) => {
    await page.click('text=Предсказания');
    await page.waitForLoadState('networkidle').catch(() => {});
    
    // Note: Polymarket content is inherently in English (external data source)
    // But our interface labels should still be in Russian
    await expect(page.getByText('рынков').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Общий объём').first()).toBeVisible();
  });

  test('Navigation sidebar - check Russian labels', async ({ page }) => {
    // Check sidebar navigation items
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(page.getByText('Портфель').first()).toBeVisible();
    await expect(page.getByText('Посты').first()).toBeVisible();
    await expect(page.getByText('Идеи').first()).toBeVisible();
    await expect(page.getByText('Чат').first()).toBeVisible();
    await expect(page.getByText('Настройки').first()).toBeVisible();
    await expect(page.getByText('AI Ассистент').first()).toBeVisible();
    await expect(page.getByText('Свернуть').first()).toBeVisible();
  });
});
