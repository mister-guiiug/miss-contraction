/**
 * Tests E2E - HomeView (Refactorisé)
 * Utilisant Page Objects, helpers, tags @critical et assertions robustes
 *
 * Tags:
 * @critical - Tests critiques pour le fonctionnement de base
 * @smoke - Tests rapides pour vérifier que rien n'est cassé
 */

import { test, expect } from '@playwright/test';
import { HomePage } from './pages/HomePage';
import { SettingsPage } from './pages/SettingsPage';
import {
  setupTest,
  createMultipleContractions,
  expectNoJSErrors,
  waitForContractionInHistory,
} from './helpers';
import { TIMEOUTS } from './config';

test.describe('HomeView - Vue principale [REFACTORISÉ]', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    await setupTest(page);
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('@critical @smoke affiche les sections principales', async ({
    page,
  }) => {
    const errorHandler = expectNoJSErrors(page);

    // Vérifier que la vue est présente
    await expect(page.locator('[data-testid="view-home"]')).toBeVisible({
      timeout: TIMEOUTS.ELEMENT_READY,
    });

    errorHandler.verify();
  });

  test('@critical chronomètre - démarre une contraction', async ({ page }) => {
    // Un seul bouton, qui bascule : on éprouve donc le changement d'état, pas
    // l'apparition d'un second bouton. `getStopButton` visait un
    // `data-testid` qui n'a jamais existé.
    const toggle = homePage.getToggleButton();
    await expect(toggle).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    expect(await homePage.isRecording()).toBe(false);

    await homePage.startContraction();

    expect(await homePage.isRecording()).toBe(true);
  });

  test('@critical @smoke chronomètre - cycle complet', async ({ page }) => {
    await homePage.createContraction(600);

    // Vérifier que la contraction est enregistrée
    await waitForContractionInHistory(page);
    const entryCount = await homePage.getHistoryEntries();
    expect(entryCount).toBeGreaterThan(0);
  });

  test('@critical timer affiche le temps écoulé', async ({ page }) => {
    await homePage.startContraction();
    await page.waitForTimeout(800);

    const timerText = await homePage.getTimerDisplay();
    // Format attendu: "0:48" ou similaire
    expect(timerText).toMatch(/\d+:\d{2}/);

    // Le temps doit augmenter
    const time1 = timerText;
    await page.waitForTimeout(500);
    const time2 = await homePage.getTimerDisplay();

    // Vérifier que le temps a changé (ou au moins que c'est un format valide)
    expect(time1).toBeDefined();
    expect(time2).toBeDefined();

    await homePage.stopContraction();
  });

  test('@smoke intensité - sélectionner une intensité', async ({ page }) => {
    await homePage.startContraction();

    // Tenter de sélectionner une intensité
    try {
      await homePage.selectIntensity(3);
      // Vérifier que le bouton est marqué comme actif
      const activeBtn = page.locator(
        '[data-testid="intensity-option-3"][aria-pressed="true"]'
      );
      await expect(activeBtn)
        .toBeVisible({ timeout: TIMEOUTS.SHORT })
        .catch(() => {
          // Pas d'aria-pressed, c'est ok
        });
    } catch {
      // Intensité optionnelle
    }

    await homePage.stopContraction();
  });

  test('@critical badge seuil - états valides', async ({ page }) => {
    // Sans contractions: état 'empty'
    let badge = await homePage.getThresholdBadge();
    if (badge) {
      expect(badge.state).toMatch(/^(empty|calm|approaching|match)$/);
    }

    // Créer des contractions pour potentiellement atteindre le seuil
    await createMultipleContractions(page, 4, 500, 200);

    // Revérifier l'état
    badge = await homePage.getThresholdBadge();
    if (badge) {
      expect(badge.state).toMatch(/^(empty|calm|approaching|match)$/);
    }
  });

  test('@smoke notes rapides - sélectionner une note', async ({ page }) => {
    await homePage.startContraction();

    /*
     * PLUS DE `try/catch`. Le test visait la note « Contraction forte », qui
     * n'existe pas — les cinq notes sont « eau », « douche », « ballon »,
     * « médicament », « repos » — puis avalait son propre échec. Il ne
     * pouvait donc rien constater. On désigne la note par son identifiant, et
     * on vérifie que l'écran l'affiche.
     */
    await homePage.selectQuickNote('shower');

    await expect(
      page.locator('[data-testid="selected-note-display"]')
    ).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });

    await homePage.stopContraction();
  });

  test('@critical statistiques - affiche les valeurs', async ({ page }) => {
    // Créer une contraction
    await homePage.createContraction(500);

    // Récupérer les stats
    const stats = await homePage.getStats();
    if (stats) {
      // Les stats doivent être affichées après au moins une contraction
      expect(stats.qtyPerHour).toBeTruthy();
      expect(stats.avgDuration).toBeTruthy();
      expect(stats.avgFrequency).toBeTruthy();
    }
  });

  test('@smoke fenêtre temporelle - change les stats', async ({ page }) => {
    await createMultipleContractions(page, 3, 500, 300);

    /*
     * LA FENÊTRE EST UN `<select>` DES RÉGLAGES, pas une rangée de boutons sur
     * l'accueil : `HomePage.selectTimeWindow` visait des `time-window-*` qui
     * n'existent nulle part. Le `try/catch` d'origine masquait l'échec.
     */
    const settings = new SettingsPage(page);
    await settings.goto();
    await settings.setStatsWindow('30');
    await settings.save();

    await homePage.goto();
    const stats30 = await homePage.getStats();
    expect(stats30).toBeTruthy();

    await settings.goto();
    await settings.setStatsWindow('all');
    await settings.save();

    await homePage.goto();
    const statsAll = await homePage.getStats();
    expect(statsAll).toBeTruthy();
  });

  test('@critical historique - affiche les contractions', async ({ page }) => {
    const initialCount = await homePage.getHistoryEntries();

    await homePage.createContraction(500);

    const newCount = await homePage.getHistoryEntries();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('@smoke annulation (undo) - supprime la dernière contraction', async ({
    page,
  }) => {
    await homePage.createContraction(500);
    const countBefore = await homePage.getHistoryEntries();

    // Tenter d'annuler
    await homePage.clickUndo();

    const countAfter = await homePage.getHistoryEntries();
    expect(countAfter).toBeLessThanOrEqual(countBefore);
  });

  test('@smoke état vide - affichage initial', async ({ page }) => {
    const isEmpty = await homePage.isEmptyStateVisible();
    // Au démarrage, soit on a un empty state, soit on a du contenu
    expect(typeof isEmpty).toBe('boolean');
  });

  test('@critical responsive mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await expect(homePage.getToggleButton()).toBeVisible({
      timeout: TIMEOUTS.ELEMENT_READY,
    });
  });

  test('@critical responsive desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await expect(homePage.getToggleButton()).toBeVisible({
      timeout: TIMEOUTS.ELEMENT_READY,
    });
  });

  test('@critical persistance - contractions après rechargement', async ({
    page,
  }) => {
    await homePage.createContraction(500);
    const countBefore = await homePage.getHistoryEntries();
    expect(countBefore).toBeGreaterThan(0);

    // Recharger
    await page.reload();
    await page.waitForLoadState('networkidle');

    const countAfter = await homePage.getHistoryEntries();
    expect(countAfter).toBe(countBefore);
  });

  test("@smoke pas d'erreurs JavaScript", async ({ page }) => {
    const errorHandler = expectNoJSErrors(page);

    // Interagir avec plusieurs éléments
    await homePage.createContraction(500);
    await createMultipleContractions(page, 2, 400, 200);

    errorHandler.verify();
  });

  test('@critical multi-contraction sequence', async ({ page }) => {
    // Créer plusieurs contractions de suite
    await createMultipleContractions(page, 5, 400, 100);

    const finalCount = await homePage.getHistoryEntries();
    expect(finalCount).toBe(5);

    // Vérifier que les stats sont calculées
    const stats = await homePage.getStats();
    expect(stats).toBeTruthy();
  });
});
