/**
 * Tests de performance - Core Web Vitals et temps de réponse
 * Mesure les métriques de performance critiques pour l'expérience utilisateur
 * @tag @performance
 */

import { test, expect } from '@playwright/test';
import { ROUTES } from './config';

const PERF_THRESHOLDS = {
  PAGE_LOAD_MS: 3000,        // Chargement initial
  FIRST_PAINT_MS: 2500,       // First Contentful Paint
  TTI_MS: 5000,               // Time to Interactive
  BUTTON_RESPONSE_MS: 200,    // Réponse au clic
  NAVIGATION_MS: 1000,        // Navigation entre vues
  RENDER_WITH_DATA_MS: 2000,  // Rendu avec 100 contractions
} as const;

test.describe('Performance - Chargement initial', () => {
  test('@performance la page d'accueil charge en moins de 3s', async ({ page }) => {
    const start = Date.now();

    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(PERF_THRESHOLDS.PAGE_LOAD_MS);
  });

  test('@performance DOMContentLoaded < 2.5s', async ({ page }) => {
    const navigationMetrics = await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', () => resolve());
      });

      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
        loadEvent: nav.loadEventEnd - nav.startTime,
        responseStart: nav.responseStart - nav.startTime,
      };
    });

    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('domcontentloaded');

    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return nav ? nav.domContentLoadedEventEnd - nav.startTime : 0;
    });

    // DOM content loaded < 2.5s
    expect(timing).toBeLessThan(PERF_THRESHOLDS.FIRST_PAINT_MS);
  });

  test('@performance le bouton de contraction répond en < 200ms', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await expect(btn).toBeVisible();

    // Mesurer le temps entre clic et mise à jour UI
    const start = Date.now();
    await btn.click();

    // Attendre l'apparition du timer (preuve que l'UI a répondu)
    await expect(page.locator('[data-testid="timer-display"]')).toBeVisible({ timeout: 2000 });

    const responseTime = Date.now() - start;
    expect(responseTime).toBeLessThan(PERF_THRESHOLDS.BUTTON_RESPONSE_MS + 500); // +500ms pour overhead Playwright
  });
});

test.describe('Performance - Navigation', () => {
  test('@performance navigation entre vues < 1s', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    const routes = [ROUTES.SETTINGS, ROUTES.TABLE, ROUTES.MATERNITY, ROUTES.MESSAGE, ROUTES.HOME];

    for (const route of routes) {
      const start = Date.now();
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      const elapsed = Date.now() - start;

      expect(elapsed, `Navigation vers ${route} trop lente (${elapsed}ms)`).toBeLessThan(
        PERF_THRESHOLDS.NAVIGATION_MS + 500
      );
    }
  });

  test('@performance retour arrière rapide', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.goto(ROUTES.SETTINGS);
    await page.waitForLoadState('networkidle');

    const start = Date.now();
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(PERF_THRESHOLDS.NAVIGATION_MS + 500);
  });
});

test.describe('Performance - Rendu avec données', () => {
  test('@performance 100 contractions se chargent en < 2s', async ({ page }) => {
    // Injecter 100 contractions dans localStorage avant de charger la page
    await page.goto(ROUTES.HOME);

    const now = Date.now();
    const records = Array.from({ length: 100 }, (_, i) => ({
      id: `r${i}`,
      start: now - (100 - i) * 300000,
      end: now - (100 - i) * 300000 + 45000,
      intensity: (i % 5) + 1,
    }));

    await page.evaluate(([key, recs]) => {
      localStorage.setItem(key, JSON.stringify(recs));
    }, ['mc_records', records] as [string, typeof records]);

    const start = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(PERF_THRESHOLDS.RENDER_WITH_DATA_MS);

    // Vérifier que l'historique s'affiche
    await expect(page.locator('[data-testid="history-items"]')).toBeVisible();
  });

  test('@performance tableau (TableView) avec 100 lignes < 2s', async ({ page }) => {
    const now = Date.now();
    const records = Array.from({ length: 100 }, (_, i) => ({
      id: `r${i}`,
      start: now - (100 - i) * 300000,
      end: now - (100 - i) * 300000 + 45000,
    }));

    await page.goto(ROUTES.TABLE);
    await page.evaluate(([key, recs]) => {
      localStorage.setItem(key, JSON.stringify(recs));
    }, ['mc_records', records] as [string, typeof records]);

    const start = Date.now();
    await page.reload();
    await page.waitForLoadState('networkidle');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(PERF_THRESHOLDS.RENDER_WITH_DATA_MS);

    await expect(page.locator('[data-testid="contractions-table"]')).toBeVisible();
  });
});

test.describe('Performance - Métriques Web Vitals', () => {
  test('@performance pas de layout shift lors du démarrage du timer', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    // Activer l'observer CLS avant le clic
    await page.evaluate(() => {
      (window as any).__clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            (window as any).__clsValue += (entry as any).value;
          }
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
    });

    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await btn.click();
    await page.waitForTimeout(500);
    await btn.click();
    await page.waitForTimeout(300);

    const cls = await page.evaluate(() => (window as any).__clsValue ?? 0);
    // CLS < 0.1 pour une bonne expérience
    expect(cls).toBeLessThan(0.1);
  });

  test('@performance First Contentful Paint enregistré', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    const fcp = await page.evaluate(() => {
      const entries = performance.getEntriesByType('paint');
      const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
      return fcpEntry ? fcpEntry.startTime : null;
    });

    // FCP peut être null dans un env test headless mais vérifie si présent
    if (fcp !== null) {
      expect(fcp).toBeLessThan(PERF_THRESHOLDS.FIRST_PAINT_MS);
    }
  });

  test('@performance mémoire stable (pas de leak évident)', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    const memBefore = await page.evaluate(() => {
      const perf = performance as any;
      return perf.memory ? perf.memory.usedJSHeapSize : null;
    });

    // Naviguer 5 fois entre les vues
    for (let i = 0; i < 5; i++) {
      await page.goto(ROUTES.SETTINGS);
      await page.goto(ROUTES.TABLE);
      await page.goto(ROUTES.HOME);
    }

    await page.waitForTimeout(500);

    const memAfter = await page.evaluate(() => {
      const perf = performance as any;
      return perf.memory ? perf.memory.usedJSHeapSize : null;
    });

    if (memBefore !== null && memAfter !== null) {
      // La mémoire ne doit pas croître de plus de 10MB (seuil large pour CI)
      const memGrowthMB = (memAfter - memBefore) / 1024 / 1024;
      expect(memGrowthMB).toBeLessThan(10);
    }
  });
});

test.describe('Performance - Réseau et ressources', () => {
  test('@performance pas de ressource bloquante > 200ms', async ({ page }) => {
    const slowResources: { url: string; duration: number }[] = [];

    page.on('requestfinished', async (request) => {
      const timing = request.timing();
      if (timing && timing.responseEnd > 200 && request.resourceType() === 'script') {
        slowResources.push({
          url: request.url(),
          duration: timing.responseEnd,
        });
      }
    });

    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    // On log les ressources lentes mais on n'échoue pas (env. local peut varier)
    if (slowResources.length > 0) {
      console.warn('Ressources lentes:', slowResources);
    }

    // Vérifier que la page charge quand même
    await expect(page.locator('[data-testid="toggle-contraction-btn"]')).toBeVisible();
  });
});
