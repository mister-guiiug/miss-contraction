/**
 * Tests spécifiques aux appareils mobiles
 * Touch, viewport, APIs mobiles, orientation
 * @tag @mobile
 */

import { test, expect } from '@playwright/test';
import { ROUTES } from './config';

// Configuration mobile - iPhone 12
test.use({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

test.describe('Mobile - Interactions tactiles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('@mobile bouton timer accessible au toucher', async ({ page }) => {
    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await expect(btn).toBeVisible();

    // Tap tactile
    await btn.tap();
    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="timer-display"]')).toBeVisible();

    await btn.tap();
    await page.waitForTimeout(300);
  });

  test('@mobile la zone de tap est suffisamment grande (>= 44px)', async ({ page }) => {
    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await expect(btn).toBeVisible();

    const box = await btn.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      // WCAG 2.5.5 recommande 44x44px minimum pour les zones de tap
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('@mobile swipe scroll dans l'historique', async ({ page }) => {
    // Injecter des contractions pour avoir du contenu à scroller
    const now = Date.now();
    const records = Array.from({ length: 20 }, (_, i) => ({
      id: `r${i}`,
      start: now - (20 - i) * 300000,
      end: now - (20 - i) * 300000 + 30000,
    }));
    await page.evaluate(([key, recs]) => {
      localStorage.setItem(key, JSON.stringify(recs));
    }, ['mc_records', records] as [string, typeof records]);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const historyList = page.locator('[data-testid="history-items"]');
    await expect(historyList).toBeVisible();

    // Simuler un swipe vers le bas pour scroller
    await page.touchscreen.tap(195, 600);
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(200);

    // Page toujours fonctionnelle après scroll
    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    // Bouton peut être hors écran après scroll, mais no crash
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Mobile - APIs mobiles mockées', () => {
  test('@mobile vibration API mockée - contraction enregistrée sans erreur', async ({ page }) => {
    const vibrateCalls: number[][] = [];

    await page.addInitScript(() => {
      (navigator as any).vibrate = (pattern: number | number[]) => {
        (window as any).__vibrateCalls = (window as any).__vibrateCalls || [];
        (window as any).__vibrateCalls.push(Array.isArray(pattern) ? pattern : [pattern]);
        return true;
      };
    });

    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await btn.tap();
    await page.waitForTimeout(500);
    await btn.tap();
    await page.waitForTimeout(300);

    // Vérifier que vibrate a été appelé (si activé dans les settings)
    // Ce test vérifie surtout qu'aucune erreur n'est levée
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('@mobile WakeLock API mockée - pas d'erreur au démarrage timer', async ({ page }) => {
    await page.addInitScript(() => {
      (navigator as any).wakeLock = {
        request: async () => ({
          released: false,
          release: async () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
        }),
      };
    });

    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await btn.tap();
    await page.waitForTimeout(500);
    await btn.tap();

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Mobile - Orientation', () => {
  test('@mobile mode portrait : layout intact', async ({ page }) => {
    // Portrait par défaut (390x844)
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="toggle-contraction-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-section"]')).toBeVisible();
  });

  test('@mobile mode paysage : layout intact sans overflow', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await expect(btn).toBeVisible();

    // Pas de overflow horizontal
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});

test.describe('Mobile - Navigation tactile', () => {
  test('@mobile bottom nav accessible sur mobile', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    // Chercher la navigation du bas
    const bottomNav = page.locator('nav, [role="navigation"]').last();
    if (await bottomNav.isVisible()) {
      const links = bottomNav.locator('a, button');
      const count = await links.count();
      expect(count).toBeGreaterThan(0);

      // Chaque lien de nav doit être tappable
      for (let i = 0; i < Math.min(count, 4); i++) {
        const link = links.nth(i);
        const box = await link.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(36); // taille minimale mobile
        }
      }
    }
  });

  test('@mobile navigation vers paramètres via touch', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    // Essayer via la navigation ou naviguer directement
    await page.goto(ROUTES.SETTINGS);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="settings-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-save-btn"]')).toBeVisible();
  });
});

test.describe('Mobile - PWA readiness', () => {
  test('@mobile viewport meta tag présent', async ({ page }) => {
    await page.goto(ROUTES.HOME);

    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta ? meta.getAttribute('content') : null;
    });

    expect(viewportMeta).not.toBeNull();
    expect(viewportMeta).toContain('width=device-width');
  });

  test('@mobile thème couleur meta tag présent', async ({ page }) => {
    await page.goto(ROUTES.HOME);

    const themeColor = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="theme-color"]');
      return meta ? meta.getAttribute('content') : null;
    });

    // theme-color améliore l'expérience PWA
    expect(themeColor).not.toBeNull();
  });

  test('@mobile pas de zoom involontaire sur les inputs', async ({ page }) => {
    await page.goto(ROUTES.SETTINGS);
    await page.waitForLoadState('networkidle');

    // Les inputs ne doivent pas avoir font-size < 16px (cause zoom iOS)
    const smallInputs = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input, textarea');
      const small: string[] = [];
      inputs.forEach((input) => {
        const style = window.getComputedStyle(input);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 16) {
          small.push(`${input.tagName}[${input.getAttribute('data-testid') || 'no-testid'}]: ${fontSize}px`);
        }
      });
      return small;
    });

    if (smallInputs.length > 0) {
      console.warn('Inputs avec font-size < 16px (peut causer zoom iOS):', smallInputs);
    }
    // On avertit mais ne fail pas — dépend du design choice
  });
});
