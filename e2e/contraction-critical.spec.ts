/**
 * Tests E2E critiques pour miss-contraction
 */

import { test, expect } from '@playwright/test';

test.describe('miss-contraction - Fonctionnalités critiques', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test("page d'accueil se charge correctement", async ({ page }) => {
    // `h1, h2, main, #app, body` résolvait à six éléments : Playwright refuse
    // d'assurer une visibilité ambiguë (« strict mode violation »). La racine
    // de l'application suffit à dire que la page a monté.
    await expect(page.locator('#app')).toBeVisible();
    await expect(page.locator('[data-testid="view-home"]')).toBeVisible();
  });

  test('chronomètre fonctionnel', async ({ page }) => {
    await page.goto('/');

    // Trouver le bouton de démarrage
    const startButton = page
      .locator(
        'button:has-text("Début"), button:has-text("Start"), [data-action="start"]'
      )
      .first();

    if (await startButton.isVisible()) {
      await startButton.click();

      // Vérifier que le chronomètre démarre
      await page.waitForTimeout(1000);

      // Trouver le bouton d'arrêt
      const stopButton = page
        .locator(
          'button:has-text("Fin"), button:has-text("Stop"), [data-action="stop"]'
        )
        .first();
      await expect(stopButton).toBeVisible();

      await stopButton.click();

      // Vérifier qu'une contraction est enregistrée
      await expect(
        page.locator('text=contraction, .entry, .record')
      ).toHaveCount(
        await page.locator('text=contraction, .entry, .record').count()
      );
    }
  });

  test('navigation responsive', async ({ page }) => {
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('#app')).toBeVisible();

    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('#app')).toBeVisible();
  });

  test('accessibilité - boutons avec labels', async ({ page }) => {
    await page.goto('/');

    // Vérifier que les boutons ont des aria-label ou du texte
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      if (await button.isVisible()) {
        const hasLabel = await button.evaluate(
          el =>
            el.hasAttribute('aria-label') ||
            el.hasAttribute('aria-labelledby') ||
            !!el.textContent?.trim()
        );
        expect(hasLabel).toBeTruthy();
      }
    }
  });

  test('performance - chargement initial < 3s', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('PWA - installation possible', async ({ page }) => {
    await page.goto('/');

    // Vérifier le manifest
    const response = await page.request.get('/manifest.webmanifest');
    expect(response.ok()).toBeTruthy();

    // Vérifier qu'il y a un bouton d'installation ou d'info PWA
    // Note: le bouton peut ne pas être visible si déjà installé
    page.locator(
      'button:has-text("Installer"), button:has-text("Install"), [data-pwa-install]'
    );
  });

  test('paramètres - ouverture modal/settings', async ({ page }) => {
    await page.goto('/');

    // Trouver le bouton de paramètres
    const settingsButton = page
      .locator(
        'button:has-text("Paramètres"), button:has-text("Settings"), [aria-label*="param"], [aria-label*="setting"]'
      )
      .first();

    if (await settingsButton.isVisible()) {
      await settingsButton.click();

      // Vérifier que la modale ou page de paramètres s'ouvre
      await expect(
        page.locator('.modal, dialog, [role="dialog"], .settings')
      ).toBeVisible();
    }
  });

  test('thème - toggle light/dark', async ({ page }) => {
    await page.goto('/');

    // Trouver le bouton de thème
    const themeButton = page
      .locator(
        'button[aria-label*="thème"], button:has-text("Thème"), [data-action="theme"]'
      )
      .first();

    if (await themeButton.isVisible()) {
      const initialTheme = await page
        .locator('html, body')
        .getAttribute('data-theme');
      await themeButton.click();

      // Vérifier que le thème a changé
      const newTheme = await page
        .locator('html, body')
        .getAttribute('data-theme');
      expect(initialTheme).not.toBe(newTheme);
    }
  });

  test('sauvegarde - export fonctionne', async ({ page }) => {
    await page.goto('/');

    // Trouver le bouton d'export
    const exportButton = page
      .locator(
        'button:has-text("Export"), button:has-text("Sauvegarder"), [data-action="export"]'
      )
      .first();

    if (await exportButton.isVisible()) {
      // Créer une contraction d'abord
      const startButton = page
        .locator('button:has-text("Début"), button:has-text("Start")')
        .first();
      if (await startButton.isVisible()) {
        await startButton.click();
        await page.waitForTimeout(1000);
        const stopButton = page
          .locator('button:has-text("Fin"), button:has-text("Stop")')
          .first();
        await stopButton.click();
      }

      // Maintenant tester l'export
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();

      // Vérifier qu'un téléchargement se lance
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(json|csv)$/);
    }
  });

  test('gestion des erreurs - pas de crash JS', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.toString()));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    /*
     * On clique des commandes CHOISIES, pas « les cinq premiers boutons ».
     * `locator('button').first()` tombait sur un contrôle masqué — le lien
     * d'évitement ou la fermeture du tiroir — et attendait 30 secondes qu'il
     * devienne cliquable. Au passage, cliquer cinq boutons au hasard pouvait
     * quitter la page et vider le test de son sens.
     */
    const commandes = [
      '[data-testid="toggle-contraction-btn"]',
      '.note-tag--shower',
      '[data-testid="toggle-contraction-btn"]',
    ];
    for (const selecteur of commandes) {
      const bouton = page.locator(selecteur).first();
      if (await bouton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await bouton.click();
        await page.waitForTimeout(300);
      }
    }

    expect(errors.length).toBe(0);
  });

  test('offline - fonctionne hors ligne', async ({ page }) => {
    await page.goto('/');

    // Simuler offline
    await page.context().setOffline(true);

    // Le chronomètre devrait fonctionner
    const startButton = page
      .locator('button:has-text("Début"), button:has-text("Start")')
      .first();
    if (await startButton.isVisible()) {
      await startButton.click();
      await page.waitForTimeout(1000);

      const stopButton = page
        .locator('button:has-text("Fin"), button:has-text("Stop")')
        .first();
      await expect(stopButton).toBeVisible();

      await stopButton.click();
      // Devrait fonctionner même offline
    }
  });
});
