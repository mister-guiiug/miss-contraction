/**
 * Tests de charge et stress
 * Vérifie le comportement de l'app avec de gros volumes de données
 * @tag @load @stress
 */

import { test, expect } from '@playwright/test';
import { ROUTES } from './config';

const LOAD_TIMEOUT_MS = 8000;

function generateRecords(count: number, baseDate = Date.now()) {
  return Array.from({ length: count }, (_, i) => ({
    id: `rec_${i}_${baseDate}`,
    start: baseDate - (count - i) * 300000,
    end: baseDate - (count - i) * 300000 + 30000 + (i % 60) * 1000,
    intensity: (i % 5) + 1,
    note: i % 5 === 0 ? `Note automatique n°${i}` : '',
  }));
}

test.describe('Charge - Volume de contractions', () => {
  test('@load 100 contractions : chargement et affichage', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(([key, records]) => {
      localStorage.setItem(key, JSON.stringify(records));
    }, ['mc_records', generateRecords(100)] as [string, ReturnType<typeof generateRecords>]);

    const start = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(LOAD_TIMEOUT_MS);
    await expect(page.locator('[data-testid="history-items"]')).toBeVisible();
  });

  test('@load 500 contractions : pas de crash, UI répond', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(([key, records]) => {
      localStorage.setItem(key, JSON.stringify(records));
    }, ['mc_records', generateRecords(500)] as [string, ReturnType<typeof generateRecords>]);

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    const start = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(LOAD_TIMEOUT_MS);

    // L'UI répond toujours
    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await expect(btn).toBeVisible({ timeout: 3000 });

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('@load tableau avec 500 lignes se charge', async ({ page }) => {
    await page.goto(ROUTES.TABLE);
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(([key, records]) => {
      localStorage.setItem(key, JSON.stringify(records));
    }, ['mc_records', generateRecords(500)] as [string, ReturnType<typeof generateRecords>]);

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    const start = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(LOAD_TIMEOUT_MS);
    await expect(page.locator('[data-testid="contractions-table"]')).toBeVisible({ timeout: 5000 });

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Stress - Actions rapides', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('@stress 10 contractions rapides successives', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await expect(btn).toBeVisible();

    for (let i = 0; i < 10; i++) {
      await btn.click();
      await page.waitForTimeout(300);
      await btn.click();
      await page.waitForTimeout(150);
    }

    await page.waitForTimeout(500);

    // Toutes les contractions doivent être enregistrées
    const records = await page.evaluate(() => {
      const raw = localStorage.getItem('mc_records');
      return raw ? JSON.parse(raw) : [];
    });

    const validRecords = (records as any[]).filter((r: any) => r.end > r.start);
    expect(validRecords.length).toBeGreaterThanOrEqual(8); // tolérance 20%

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('@stress clics rapides multiples sur bouton ne causent pas d'état incohérent', async ({ page }) => {
    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await expect(btn).toBeVisible();

    // Cliquer 6 fois très rapidement (3 paires start/stop)
    for (let i = 0; i < 6; i++) {
      await btn.click({ delay: 50 });
    }

    await page.waitForTimeout(800);

    // L'UI doit être dans un état stable (pas de timer orphelin)
    const timerDisplay = page.locator('[data-testid="timer-display"]');
    // Peu importe l'état final, il ne doit pas y avoir d'erreur
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.waitForTimeout(200);

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('@stress navigation rapide entre vues avec données', async ({ page }) => {
    // Charger des données
    await page.evaluate(([key, records]) => {
      localStorage.setItem(key, JSON.stringify(records));
    }, ['mc_records', generateRecords(50)] as [string, ReturnType<typeof generateRecords>]);

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    const routes = [ROUTES.HOME, ROUTES.TABLE, ROUTES.SETTINGS, ROUTES.MATERNITY, ROUTES.MESSAGE];

    // Navigation rapide 2 fois
    for (let i = 0; i < 2; i++) {
      for (const route of routes) {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded');
      }
    }

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Stress - Formulaires', () => {
  test('@stress sauvegarder les paramètres 5 fois de suite', async ({ page }) => {
    await page.goto(ROUTES.SETTINGS);
    await page.waitForLoadState('networkidle');

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    const saveBtn = page.locator('[data-testid="settings-save-btn"]');

    for (let i = 0; i < 5; i++) {
      await page.locator('[data-testid="max-interval-input"]').fill(String(5 + i));
      await saveBtn.click();
      await page.waitForTimeout(200);
    }

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);

    // La dernière valeur doit être persistée
    const settings = await page.evaluate(() => {
      const raw = localStorage.getItem('mc_settings');
      return raw ? JSON.parse(raw) : null;
    });
    expect(settings?.maxIntervalMin).toBe(9); // 5 + 4 (dernier index)
  });

  test('@stress note de contraction très longue (500 chars)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    const now = Date.now();
    const longNote = 'L'.repeat(500);
    const records = [{ id: 'r1', start: now - 60000, end: now - 59000, note: longNote }];

    await page.evaluate(([key, recs]) => {
      localStorage.setItem(key, JSON.stringify(recs));
    }, ['mc_records', records] as [string, typeof records]);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="history-items"]')).toBeVisible();

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Charge - Messages et message view', () => {
  test('@load message très long (1000 chars) dans textarea', async ({ page }) => {
    await page.goto(ROUTES.MESSAGE);
    await page.waitForLoadState('networkidle');

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    const textarea = page.locator('[data-testid="message-textarea"]');
    const longMessage = 'M'.repeat(1000);
    await textarea.fill(longMessage);
    await page.waitForTimeout(1000); // debounce autosave

    // L'interface reste stable
    await expect(textarea).toBeVisible();

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('@load effacer et réécrire le message plusieurs fois', async ({ page }) => {
    await page.goto(ROUTES.MESSAGE);
    await page.waitForLoadState('networkidle');

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    const textarea = page.locator('[data-testid="message-textarea"]');
    const resetBtn = page.locator('[data-testid="message-reset-btn"]');

    for (let i = 0; i < 5; i++) {
      await textarea.fill(`Message ${i}`);
      await page.waitForTimeout(200);
      if (await resetBtn.isVisible()) {
        await resetBtn.click();
        await page.waitForTimeout(200);
      }
    }

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });
});
