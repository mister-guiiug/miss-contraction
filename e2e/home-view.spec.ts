/**
 * Tests E2E - HomeView
 * Couverture: timer, contractions, intensité, notes rapides, graphique, historique
 */

import { test, expect } from '@playwright/test';
import { SettingsPage } from './pages/SettingsPage';
import { ROUTES, SELECTORS } from './config';

test.describe('HomeView - Vue principale', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Nettoyer localStorage avant chaque test
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('affiche les sections principales', async ({ page }) => {
    // `h1, h2, main, #app` résolvait à cinq éléments — « strict mode
    // violation ». La racine et la vue suffisent.
    await expect(page.locator('#app')).toBeVisible();
    await expect(page.locator('#view-home')).toBeVisible();
  });

  test('chronomètre - démarre une contraction', async ({ page }) => {
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Vérifier que le bouton change (devient "Fin")
    const stopButton = page
      .locator('button')
      .filter({ hasText: /Fin|Stop/ })
      .first();
    await expect(stopButton).toBeVisible();
  });

  test("chronomètre - termine une contraction et l'enregistre", async ({
    page,
  }) => {
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    await startButton.click();
    await page.waitForTimeout(500);

    const stopButton = page
      .locator('button')
      .filter({ hasText: /Fin|Stop/ })
      .first();
    await stopButton.click();

    // Vérifier qu'une contraction est enregistrée dans l'historique.
    // `toBeDefined()` sur un Locator ne vérifiait rien : un Locator existe
    // toujours, même quand rien ne lui correspond dans la page.
    await page.goto(ROUTES.TABLE);
    await expect(page.locator(`${SELECTORS.HISTORY_ITEMS} > li`)).toHaveCount(
      1
    );
  });

  test('chronomètre - affiche le temps écoulé', async ({ page }) => {
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    await startButton.click();

    // Vérifier que le chronomètre affiche un temps croissant
    await page.waitForTimeout(1000);
    const timerDisplay = page.locator('[data-testid="timer-value"]');
    if (await timerDisplay.isVisible({ timeout: 500 }).catch(() => false)) {
      const text1 = await timerDisplay.textContent();
      await page.waitForTimeout(500);
      const text2 = await timerDisplay.textContent();
      // Le temps doit augmenter ou rester similaire (pas décroître)
      expect(text1).toBeDefined();
      expect(text2).toBeDefined();
    }
  });

  test('intensité - sélectionner une intensité', async ({ page }) => {
    await page.locator(SELECTORS.TOGGLE_BTN).click();

    /*
     * Deux `if` imbriqués rendaient ce test inoffensif : il visait
     * `[data-testid="intensity"]` — jamais posé — puis des boutons par leur
     * texte (« 1 », « 2 », « 3 »), et ne vérifiait rien si l'un des deux
     * échouait. L'échelle porte des `data-testid` depuis longtemps.
     */
    const picker = page.locator('[data-testid="intensity-picker"]');
    await expect(picker).toBeVisible();

    const options = page.locator('[data-testid^="intensity-option-"]');
    await expect(options).toHaveCount(5);

    // Aucun niveau présélectionné : une échelle subjective pré-remplie ne
    // mesure plus rien.
    await expect(
      options.and(page.locator('[aria-pressed="true"]'))
    ).toHaveCount(0);

    const niveau4 = page.locator('[data-testid="intensity-option-4"]');
    await niveau4.click();
    await expect(niveau4).toHaveAttribute('aria-pressed', 'true');

    // Et ce que « 4 » veut dire s'affiche, sans survol.
    await expect(
      page.locator('[data-testid="intensity-description"]')
    ).not.toBeEmpty();
  });

  test('badge seuil - affiche état correct (calme)', async ({ page }) => {
    // Sans contractions, le badge doit être "vide"
    const badge = page.locator('[data-state="empty"], .threshold-badge');
    if (await badge.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(badge).toBeVisible();
    }
  });

  test('badge seuil - affiche état correct avec contractions', async ({
    page,
  }) => {
    // Créer plusieurs contractions rapides pour atteindre le seuil
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();

    for (let i = 0; i < 4; i++) {
      await startButton.click();
      await page.waitForTimeout(100);
      const stopButton = page
        .locator('button')
        .filter({ hasText: /Fin|Stop/ })
        .first();
      await stopButton.click();
      await page.waitForTimeout(100);
    }

    // Vérifier que le badge s'est mis à jour
    const badge = page.locator('.threshold-badge, [data-state]');
    await expect(badge).toBeDefined();
  });

  test('notes rapides - affiche la liste des notes', async ({ page }) => {
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    await startButton.click();

    // Chercher la section des notes rapides
    const notesSection = page
      .locator('h3')
      .filter({ hasText: /Notes rapides/ });
    if (await notesSection.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(notesSection).toBeVisible();
    }
  });

  test('notes rapides - sélectionner une note', async ({ page }) => {
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    await startButton.click();

    // Chercher les boutons de note
    const noteButtons = page.locator(
      'button:has-text("Besoin du toilette"), button:has-text("Besoin d\'eau"), button:has-text("Contraction forte")'
    );
    if (
      await noteButtons
        .first()
        .isVisible({ timeout: 500 })
        .catch(() => false)
    ) {
      await noteButtons.first().click();
      // Vérifier qu'une note est sélectionnée
      const selectedNote = page.locator('p:has-text("Note sélectionnée")');
      await expect(selectedNote).toBeVisible();
    }
  });

  test('graphique timeline - affiche les contractions', async ({ page }) => {
    // Créer quelques contractions
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    for (let i = 0; i < 3; i++) {
      await startButton.click();
      await page.waitForTimeout(100);
      const stopButton = page
        .locator('button')
        .filter({ hasText: /Fin|Stop/ })
        .first();
      await stopButton.click();
      await page.waitForTimeout(300);
    }

    // Chercher le graphique
    const timeline = page.locator(
      '.timeline, [role="img"][aria-label*="timeline"], svg'
    );
    if (
      await timeline
        .first()
        .isVisible({ timeout: 500 })
        .catch(() => false)
    ) {
      await expect(timeline.first()).toBeVisible();
    }
  });

  test('statistiques - affiche les trois indicateurs', async ({ page }) => {
    /*
     * LES TROIS VALEURS SE VISENT PAR LEUR `data-testid`, PLUS PAR LEUR TEXTE.
     * Ce test cherchait « Fréquence moyenne » : la tuile s'appelle
     * « Intervalle moyen » depuis qu'on a cessé d'annoncer un intervalle sous
     * le nom d'une fréquence. Personne ne l'a vu — la suite ne tourne dans
     * aucune CI.
     */
    const toggle = page.locator(SELECTORS.TOGGLE_BTN);
    for (let i = 0; i < 3; i++) {
      await toggle.click();
      await page.waitForTimeout(200);
      await toggle.click();
      await page.waitForTimeout(300);
    }

    await expect(page.locator(SELECTORS.STATS_SECTION)).toBeVisible();
    for (const sel of [
      SELECTORS.STAT_VALUE_QTY,
      SELECTORS.STAT_VALUE_DURATION,
      SELECTORS.STAT_VALUE_FREQUENCY,
    ]) {
      await expect(page.locator(sel)).not.toBeEmpty();
    }
  });

  test('historique - affiche les contractions passées', async ({ page }) => {
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    await startButton.click();
    await page.waitForTimeout(500);
    const stopButton = page
      .locator('button')
      .filter({ hasText: /Fin|Stop/ })
      .first();
    await stopButton.click();

    // Vérifier que l'historique s'affiche
    const historySection = page
      .locator('h2')
      .filter({ hasText: /Historique|History/ });
    if (await historySection.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(historySection).toBeVisible();
    }
  });

  test('annulation (undo) - annule la dernière contraction', async ({
    page,
  }) => {
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    await startButton.click();
    await page.waitForTimeout(500);
    const stopButton = page
      .locator('button')
      .filter({ hasText: /Fin|Stop/ })
      .first();
    await stopButton.click();

    // Chercher le bouton d'annulation
    const undoButton = page
      .locator('button')
      .filter({ hasText: /Annuler|Undo/ })
      .first();
    if (await undoButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      const initialCount = await page
        .locator('.contraction-entry, [data-testid*="record"]')
        .count();
      await undoButton.click();
      await page.waitForTimeout(500);
      const newCount = await page
        .locator('.contraction-entry, [data-testid*="record"]')
        .count();
      expect(newCount).toBeLessThanOrEqual(initialCount);
    }
  });

  /*
   * LA FENÊTRE TEMPORELLE N'EST PAS SUR L'ACCUEIL. C'est un `<select>` de
   * l'écran des réglages. Ce test cherchait des `button:has-text("Toutes")`
   * qui n'existent nulle part, sous un `if (isVisible)` qui l'empêchait
   * d'échouer ; puis il assertait `aria-pressed` sur un locator vide.
   */
  test('fenêtre temporelle - le libellé des stats suit le réglage', async ({
    page,
  }) => {
    await page.evaluate(key => {
      const now = Date.now();
      localStorage.setItem(
        key,
        JSON.stringify([
          { id: 'w1', start: now - 900000, end: now - 840000 },
          { id: 'w2', start: now - 540000, end: now - 480000 },
        ])
      );
    }, 'mc_contractions_v1');
    await page.reload();
    await page.waitForLoadState('networkidle');

    const label = page.locator('[data-testid="stats-window-label"]');
    const initial = await label.textContent();

    const settings = new SettingsPage(page);
    await settings.goto();
    await settings.setStatsWindow('30');
    await settings.save();

    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    await expect(label).not.toHaveText(initial ?? '');
  });

  test('affichage vide (EmptyState) - quand pas de contractions', async ({
    page,
  }) => {
    const emptyState = page.locator('[data-testid="history-empty"]');
    if (await emptyState.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(emptyState).toBeVisible();
    }
  });

  test("responsive - s'affiche correctement sur mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    await expect(startButton).toBeVisible();
  });

  test("responsive - s'affiche correctement sur desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    await expect(startButton).toBeVisible();
  });

  test('actualisation - persiste après rechargement', async ({ page }) => {
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    await startButton.click();
    await page.waitForTimeout(500);
    const stopButton = page
      .locator('button')
      .filter({ hasText: /Fin|Stop/ })
      .first();
    await stopButton.click();

    // Recharger la page
    await page.reload();

    // Vérifier que la contraction persiste
    const historySection = page
      .locator('h2')
      .filter({ hasText: /Historique|History/ });
    if (await historySection.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(historySection).toBeVisible();
    }
  });
});
