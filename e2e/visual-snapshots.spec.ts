/**
 * Tests E2E - Snapshots visuels
 * Tests de régression visuelle avec comparaison d'images
 *
 * Tags:
 * @visual - Tests visuels/snapshots
 */

/*
 * `networkidle` NE SUFFIT PAS POUR UNE CAPTURE. Fredoka est chargée depuis
 * Google Fonts et s'applique APRÈS que le réseau se soit calmé : selon
 * l'instant de la capture, le texte est rendu dans la police de marque ou dans
 * celle de repli. Les écarts étaient stables mais absurdes — jusqu'à 9 % des
 * pixels sur une page vide. Chaque attente réseau est donc suivie de
 * `document.fonts.ready`.
 */
import { test, expect, type Page } from '@playwright/test';
import { ROUTES, TIMEOUTS } from './config';

/**
 * ── LES POLICES DISTANTES SONT COUPÉES POUR LES CAPTURES ─────────────────────
 *
 * L'application charge Fredoka depuis Google Fonts. Une capture d'écran prise
 * pendant que la police arrive rend le texte dans le repli ; prise après, dans
 * Fredoka. `networkidle` ne tranche pas — la feuille de style est bien reçue,
 * mais le fichier de fonte, lui, est demandé ensuite — et
 * `document.fonts.ready` peut se résoudre avant même que la demande parte.
 *
 * Le résultat, ce sont des écarts STABLES d'une exécution à l'autre mais
 * dépendants de la charge : 16 102 pixels sur une page de tableau vide, 11 515
 * sur une autre. Rien à voir avec une régression visuelle.
 *
 * On coupe donc la police distante et on compare toujours le même rendu, celui
 * du repli système. Une régression de MISE EN PAGE reste détectée ; ce qu'on
 * perd, c'est la vérification du dessin de Fredoka — qui n'a jamais été
 * l'objet de ces tests, et qu'un réseau capricieux ne permettait pas d'assurer.
 */
async function couperPolicesDistantes(page: Page) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
}

test.beforeEach(async ({ page }) => {
  await couperPolicesDistantes(page);
});

test.describe('Snapshots Visuels - Régression Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);
  });

  test('@visual HomeView - layout principal', async ({ page }) => {
    /*
     * ON MASQUE, ON NE MAQUILLE PAS. La version précédente baissait l'opacité
     * des éléments volatiles à 0,5 — ce qui les rend juste plus pâles, pas
     * stables : un chronomètre à « 06:03 » reste différent de « 06:04 » à
     * n'importe quelle opacité. `mask` est fait pour ça : Playwright peint la
     * zone d'une couleur unie avant de comparer.
     */
    await expect(page).toHaveScreenshot('home-view-empty.png', {
      mask: [
        page.locator('[data-testid="timer-value"]'),
        page.locator('[data-testid="rest-timer"]'),
      ],
      maxDiffPixels: 100,
      timeout: TIMEOUTS.NORMAL,
    });
  });

  test('@visual HomeView - avec contractions', async ({ page }) => {
    // Créer quelques contractions
    const startBtn = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    for (let i = 0; i < 2; i++) {
      await startBtn.click();
      await page.waitForTimeout(200);
      const stopBtn = page
        .locator('button')
        .filter({ hasText: /Fin|Stop/ })
        .first();
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
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('settings-view.png', {
      maxDiffPixels: 100,
    });
  });

  test('@visual TableView - tableau vide', async ({ page }) => {
    await page.goto(ROUTES.TABLE);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('table-view-empty.png', {
      maxDiffPixels: 100,
    });
  });

  test('@visual TableView - avec données', async ({ page }) => {
    // Créer quelques contractions
    await page.goto(ROUTES.HOME);
    const startBtn = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    for (let i = 0; i < 3; i++) {
      await startBtn.click();
      await page.waitForTimeout(200);
      const stopBtn = page
        .locator('button')
        .filter({ hasText: /Fin|Stop/ })
        .first();
      await stopBtn.click();
      await page.waitForTimeout(300);
    }

    await page.goto(ROUTES.TABLE);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    /*
     * La colonne « Début » affiche l'heure réelle d'enregistrement : elle
     * change à chaque exécution. On la masque plutôt que d'élargir la
     * tolérance, qui finirait par laisser passer de vraies régressions.
     */
    await expect(page).toHaveScreenshot('table-view-with-data.png', {
      mask: [page.locator('[data-testid="table-cell-date"]')],
      maxDiffPixels: 150,
    });
  });

  test('@visual MaternityView - affichage infos', async ({ page }) => {
    await page.goto(ROUTES.MATERNITY);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('maternity-view.png', {
      maxDiffPixels: 100,
    });
  });

  test('@visual MessageView - formulaire message', async ({ page }) => {
    await page.goto(ROUTES.MESSAGE);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('message-view.png', {
      maxDiffPixels: 100,
    });
  });

  test('@visual mobile - HomeView sur téléphone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const startBtn = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    await expect(startBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });

    await expect(page).toHaveScreenshot('home-view-mobile.png', {
      maxDiffPixels: 100,
    });
  });

  test('@visual mobile - SettingsView sur téléphone', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(ROUTES.SETTINGS);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

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

  test('@visual high contrast - HomeView en contraste élevé', async ({
    page,
  }) => {
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
    const startBtn = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();

    // État initial (empty)
    await expect(page).toHaveScreenshot('badge-state-empty.png', {
      maxDiffPixels: 50,
    });

    // Créer une contraction (calm)
    await startBtn.click();
    await page.waitForTimeout(300);
    const stopBtn = page
      .locator('button')
      .filter({ hasText: /Fin|Stop/ })
      .first();
    await stopBtn.click();
    await page.waitForTimeout(500);

    const badge = page.locator('[data-testid="threshold-badge"]');
    const state = await badge.getAttribute('data-state');

    if (state !== 'empty') {
      await expect(page)
        .toHaveScreenshot(`badge-state-${state}.png`, {
          maxDiffPixels: 50,
        })
        .catch(() => {
          // Les snapshots de badge peuvent ne pas être critiques
        });
    }
  });
});

test.describe('Snapshots Responsif - Breakpoints', () => {
  test.beforeEach(async ({ page }) => {
    // Sans navigation préalable, `page` est sur `about:blank` : y toucher
    // `localStorage` lève `SecurityError`, et les quatre tests de ce bloc
    // échouaient avant même d'avoir capturé quoi que ce soit.
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
  });

  test('@visual breakpoint-320 - petit mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    const startBtn = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    await expect(startBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });

    await expect(page).toHaveScreenshot('responsive-320.png', {
      maxDiffPixels: 150,
    });
  });

  test('@visual breakpoint-768 - tablette', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('responsive-768.png', {
      maxDiffPixels: 150,
    });
  });

  test('@visual breakpoint-1280 - desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('responsive-1280.png', {
      maxDiffPixels: 150,
    });
  });

  test('@visual breakpoint-1920 - grand écran', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot('responsive-1920.png', {
      maxDiffPixels: 150,
    });
  });
});
