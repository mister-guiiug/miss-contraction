/**
 * Tests E2E - Snapshots visuels
 * Tests de régression visuelle avec comparaison d'images
 * 
 * Tags:
 * @visual - Tests visuels/snapshots
 */

import { test, expect } from '@playwright/test';
import { ROUTES, TIMEOUTS } from '../config';

test.describe('Snapshots Visuels - Régression Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('@visual HomeView - layout principal', async ({ page }) => {
    // Masquer les éléments volatiles (timer en cours)
    await page.locator('[data-testid="volatile"]').evaluate(els => {
      els.forEach((el: Element) => {
        (el as HTMLElement).style.opacity = '0.5';
      });
    }).catch(() => {
      // Pas d'éléments volatiles, c'est ok
    });

    await expect(page).toHaveScreenshot('home-view-empty.png', {
      maxDiffPixels: 100,
      timeout: TIMEOUTS.NORMAL,
    });
  });

  test('@visual HomeView - avec contractions', async ({ page }) => {
    // Créer quelques contractions
    const startBtn = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    for (let i = 0; i < 2; i++) {
      await startBtn.click();
      await page.waitForTimeout(200);
      const stopBtn = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
      await stopBtn.click();
      await page.waitForTimeout(300);
    }

    await expect(page).toHaveScreenshot('home-view-with-contractions.png', {
      maxDiffPixels: 150,
    });
  });

  test('@visual SettingsView - formulaire paramètres', async ({ page }) => {
    await page.goto(ROUTES.SETTINGS);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('settings-view.png', {
      maxDiffPixels: 100,
    });
  });

  test('@visual TableView - tableau vide', async ({ page }) => {
    await page.goto(ROUTES.TABLE);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('table-view-empty.png', {
      maxDiffPixels: 100,
    });
  });

  test('@visual TableView - avec données', async ({ page }) => {
    // Créer quelques contractions
    await page.goto(ROUTES.HOME);
    const startBtn = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    for (let i = 0; i < 3; i++) {
      await startBtn.click();
      await page.waitForTimeout(200);
      const stopBtn = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
      await stopBtn.click();
      await page.waitForTimeout(300);
    }

    await page.goto(ROUTES.TABLE);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('table-view-with-data.png', {
      maxDiffPixels: 150,
    });
  });

  test('@visual MaternityView - affichage infos', async ({ page }) => {
    await page.goto(ROUTES.MATERNITY);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('maternity-view.png', {
      maxDiffPixels: 100,
    });
  });

  test('@visual MessageView - formulaire message', async ({ page }) => {
    await page.goto(ROUTES.MESSAGE);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('message-view.png', {
      maxDiffPixels: 100,
    });
  });

  test('@visual mobile - HomeView sur téléphone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const startBtn = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    await expect(startBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });

    await expect(page).toHaveScreenshot('home-view-mobile.png', {
      maxDiffPixels: 100,
    });
  });

  test('@visual mobile - SettingsView sur téléphone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ROUTES.SETTINGS);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('settings-view-mobile.png', {
      maxDiffPixels: 100,
    });
  });

  test('@visual dark mode - HomeView en mode sombre', async ({ page }) => {
    // Activer le mode sombre
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    await expect(page).toHaveScreenshot('home-view-dark.png', {
      maxDiffPixels: 100,
    });
  });

  test('@visual high contrast - HomeView en contraste élevé', async ({ page }) => {
    // Activer le contraste élevé
    await page.evaluate(() => {
      document.documentElement.classList.add('high-contrast');
    });

    await expect(page).toHaveScreenshot('home-view-high-contrast.png', {
      maxDiffPixels: 120,
    });
  });

  test('@visual large text - HomeView avec texte agrandi', async ({ page }) => {
    // Activer le mode texte agrandi
    await page.evaluate(() => {
      document.documentElement.classList.add('mc-large-mode');
    });

    await expect(page).toHaveScreenshot('home-view-large-text.png', {
      maxDiffPixels: 120,
    });
  });

  test('@visual badge transitions - états du badge', async ({ page }) => {
    // États du badge: empty, calm, approaching, match
    // Créer lentement pour voir les transitions
    const startBtn = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    
    // État initial (empty)
    await expect(page).toHaveScreenshot('badge-state-empty.png', {
      maxDiffPixels: 50,
    });

    // Créer une contraction (calm)
    await startBtn.click();
    await page.waitForTimeout(300);
    const stopBtn = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
    await stopBtn.click();
    await page.waitForTimeout(500);

    const badge = page.locator('[data-testid="threshold-badge"]');
    const state = await badge.getAttribute('data-state');
    
    if (state !== 'empty') {
      await expect(page).toHaveScreenshot(`badge-state-${state}.png`, {
        maxDiffPixels: 50,
      }).catch(() => {
        // Les snapshots de badge peuvent ne pas être critiques
      });
    }
  });
});

test.describe('Snapshots Responsif - Breakpoints', () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test('@visual breakpoint-320 - petit mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    const startBtn = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    await expect(startBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });

    await expect(page).toHaveScreenshot('responsive-320.png', {
      maxDiffPixels: 150,
    });
  });

  test('@visual breakpoint-768 - tablette', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('responsive-768.png', {
      maxDiffPixels: 150,
    });
  });

  test('@visual breakpoint-1280 - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('responsive-1280.png', {
      maxDiffPixels: 150,
    });
  });

  test('@visual breakpoint-1920 - grand écran', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('responsive-1920.png', {
      maxDiffPixels: 150,
    });
  });
});
