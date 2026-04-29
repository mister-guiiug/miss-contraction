/**
 * Tests de régression visuelle avancés
 * Couvre tous les viewports, thèmes, et états significatifs
 * @tag @visual
 */

import { test, expect, Page } from '@playwright/test';
import { ROUTES } from './config';

// Tous les viewports à tester
const VIEWPORTS = [
  { name: 'mobile-xs', width: 320, height: 568 },
  { name: 'mobile-md', width: 375, height: 667 },
  { name: 'mobile-lg', width: 414, height: 896 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

async function clearAndLoad(page: Page, route: string) {
  await page.goto(route);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
}

async function injectContractions(page: Page, count = 5) {
  const now = Date.now();
  const records = Array.from({ length: count }, (_, i) => ({
    id: `r${i}`,
    start: now - (count - i) * 300000,
    end: now - (count - i) * 300000 + 45000 + i * 5000,
    intensity: (i % 5) + 1,
    note: i % 2 === 0 ? `Note ${i}` : '',
  }));
  await page.evaluate(([key, recs]) => {
    localStorage.setItem(key, JSON.stringify(recs));
  }, ['mc_records', records] as [string, typeof records]);
}

// === Tests par viewport ===

for (const viewport of VIEWPORTS) {
  test.describe(`Régression visuelle - ${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test(`@visual home vide - ${viewport.name}`, async ({ page }) => {
      await clearAndLoad(page, ROUTES.HOME);

      await expect(page).toHaveScreenshot(`home-empty-${viewport.name}.png`, {
        maxDiffPixels: 200,
      });
    });

    test(`@visual home avec données - ${viewport.name}`, async ({ page }) => {
      await page.goto(ROUTES.HOME);
      await page.evaluate(() => localStorage.clear());
      await injectContractions(page, 5);
      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(`home-with-data-${viewport.name}.png`, {
        maxDiffPixels: 200,
      });
    });

    test(`@visual settings - ${viewport.name}`, async ({ page }) => {
      await clearAndLoad(page, ROUTES.SETTINGS);

      await expect(page).toHaveScreenshot(`settings-${viewport.name}.png`, {
        maxDiffPixels: 200,
      });
    });

    test(`@visual table vide - ${viewport.name}`, async ({ page }) => {
      await clearAndLoad(page, ROUTES.TABLE);

      await expect(page).toHaveScreenshot(`table-empty-${viewport.name}.png`, {
        maxDiffPixels: 200,
      });
    });

    test(`@visual table avec données - ${viewport.name}`, async ({ page }) => {
      await page.goto(ROUTES.TABLE);
      await page.evaluate(() => localStorage.clear());
      await injectContractions(page, 10);
      await page.reload();
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(`table-data-${viewport.name}.png`, {
        maxDiffPixels: 200,
      });
    });

    test(`@visual maternité - ${viewport.name}`, async ({ page }) => {
      await clearAndLoad(page, ROUTES.MATERNITY);

      await expect(page).toHaveScreenshot(`maternity-${viewport.name}.png`, {
        maxDiffPixels: 200,
      });
    });

    test(`@visual message - ${viewport.name}`, async ({ page }) => {
      await clearAndLoad(page, ROUTES.MESSAGE);

      await expect(page).toHaveScreenshot(`message-${viewport.name}.png`, {
        maxDiffPixels: 200,
      });
    });
  });
}

// === Tests par thème ===

test.describe('Régression visuelle - Thèmes', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('@visual thème clair (par défaut)', async ({ page }) => {
    await clearAndLoad(page, ROUTES.HOME);
    await injectContractions(page, 3);
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('home-theme-light.png', {
      maxDiffPixels: 150,
    });
  });

  test('@visual thème sombre (prefers-color-scheme: dark)', async ({ page, browser }) => {
    // Ouvrir une page avec la préférence dark
    const context = await browser.newContext({ colorScheme: 'dark' });
    const darkPage = await context.newPage();

    await darkPage.goto(ROUTES.HOME);
    await darkPage.evaluate(() => localStorage.clear());
    await darkPage.reload();
    await darkPage.waitForLoadState('networkidle');

    await expect(darkPage).toHaveScreenshot('home-theme-dark.png', {
      maxDiffPixels: 150,
    });

    await context.close();
  });

  test('@visual mode haute lisibilité activé', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());

    // Activer le mode haute lisibilité via localStorage
    await page.evaluate(() => {
      const settings = { largeMode: true };
      localStorage.setItem('mc_settings', JSON.stringify(settings));
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('home-large-mode.png', {
      maxDiffPixels: 200,
    });
  });
});

// === Tests d'états spécifiques ===

test.describe('Régression visuelle - États UI', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('@visual timer actif (contraction en cours)', async ({ page }) => {
    await clearAndLoad(page, ROUTES.HOME);

    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await btn.click();
    await page.waitForTimeout(500); // Laisser le timer tourner

    // Masquer la valeur du timer pour stabilité du snapshot
    await page.evaluate(() => {
      const timerValue = document.querySelector('[data-testid="timer-value"]');
      if (timerValue) {
        (timerValue as HTMLElement).textContent = '00:30';
        (timerValue as HTMLElement).style.visibility = 'hidden';
      }
    });

    await expect(page).toHaveScreenshot('home-timer-active.png', {
      maxDiffPixels: 300, // Plus large car certains éléments animés
    });

    // Arrêter le timer
    await btn.click();
  });

  test('@visual historique avec 5 contractions', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await injectContractions(page, 5);
    await page.reload();
    await page.waitForLoadState('networkidle');

    const historyItems = page.locator('[data-testid="history-items"]');
    await expect(historyItems).toBeVisible();

    await expect(page.locator('[data-testid="history-items"]')).toHaveScreenshot(
      'history-list-5items.png',
      { maxDiffPixels: 150 }
    );
  });

  test('@visual stats section avec données', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await injectContractions(page, 8);
    await page.reload();
    await page.waitForLoadState('networkidle');

    const statsSection = page.locator('[data-testid="stats-section"]');
    await expect(statsSection).toBeVisible();

    await expect(statsSection).toHaveScreenshot('stats-section-8items.png', {
      maxDiffPixels: 150,
    });
  });

  test('@visual paramètres remplis', async ({ page }) => {
    await page.goto(ROUTES.SETTINGS);
    await page.evaluate(() => {
      localStorage.setItem('mc_settings', JSON.stringify({
        maxIntervalMin: 5,
        minDurationSec: 30,
        consecutiveCount: 4,
        maternityLabel: 'Clinique du Test',
        maternityPhone: '0600000000',
        maternityAddress: '1 rue du Test',
      }));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="settings-view"]')).toHaveScreenshot(
      'settings-filled.png',
      { maxDiffPixels: 150 }
    );
  });

  test('@visual maternité configurée', async ({ page }) => {
    await page.goto(ROUTES.MATERNITY);
    await page.evaluate(() => {
      localStorage.setItem('mc_settings', JSON.stringify({
        maternityLabel: 'Clinique du Soleil',
        maternityPhone: '0601020304',
        maternityAddress: '42 avenue du Test, 75001 Paris',
      }));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="maternity-view"]')).toHaveScreenshot(
      'maternity-configured.png',
      { maxDiffPixels: 150 }
    );
  });
});
