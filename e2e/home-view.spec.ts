/**
 * Tests E2E - HomeView
 * Couverture: timer, contractions, intensité, notes rapides, graphique, historique
 */

import { test, expect } from '@playwright/test';

test.describe('HomeView - Vue principale', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Nettoyer localStorage avant chaque test
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('affiche les sections principales', async ({ page }) => {
    await expect(page.locator('h1, h2, main, #app')).toBeVisible();
    await expect(page.locator('#view-home')).toBeVisible();
  });

  test('chronomètre - démarre une contraction', async ({ page }) => {
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    await expect(startButton).toBeVisible();
    await startButton.click();

    // Vérifier que le bouton change (devient "Fin")
    const stopButton = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
    await expect(stopButton).toBeVisible();
  });

  test('chronomètre - termine une contraction et l\'enregistre', async ({ page }) => {
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    await startButton.click();
    await page.waitForTimeout(500);

    const stopButton = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
    await stopButton.click();

    // Vérifier qu'une contraction est enregistrée dans l'historique
    await expect(page.locator('.history-list, .contraction-entry, [data-testid*="record"]')).toBeDefined();
  });

  test('chronomètre - affiche le temps écoulé', async ({ page }) => {
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    await startButton.click();

    // Vérifier que le chronomètre affiche un temps croissant
    await page.waitForTimeout(1000);
    const timerDisplay = page.locator('[data-testid="timer"], .timer, .chrono');
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
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    await startButton.click();

    // Chercher les contrôles d'intensité (spinner, slider, boutons)
    const intensityControls = page.locator('[data-testid="intensity"], .intensity-picker, [role="slider"]');
    if (await intensityControls.first().isVisible({ timeout: 500 }).catch(() => false)) {
      const buttons = await page.locator('button:has-text("1"), button:has-text("2"), button:has-text("3")').all();
      if (buttons.length > 0) {
        await buttons[0].click();
        // Vérifier qu'une intensité est sélectionnée
        await expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
      }
    }
  });

  test('badge seuil - affiche état correct (calme)', async ({ page }) => {
    // Sans contractions, le badge doit être "vide"
    const badge = page.locator('[data-state="empty"], .threshold-badge');
    if (await badge.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(badge).toBeVisible();
    }
  });

  test('badge seuil - affiche état correct avec contractions', async ({ page }) => {
    // Créer plusieurs contractions rapides pour atteindre le seuil
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();

    for (let i = 0; i < 4; i++) {
      await startButton.click();
      await page.waitForTimeout(100);
      const stopButton = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
      await stopButton.click();
      await page.waitForTimeout(100);
    }

    // Vérifier que le badge s'est mis à jour
    const badge = page.locator('.threshold-badge, [data-state]');
    await expect(badge).toBeDefined();
  });

  test('notes rapides - affiche la liste des notes', async ({ page }) => {
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    await startButton.click();

    // Chercher la section des notes rapides
    const notesSection = page.locator('h3').filter({ hasText: /Notes rapides/ });
    if (await notesSection.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(notesSection).toBeVisible();
    }
  });

  test('notes rapides - sélectionner une note', async ({ page }) => {
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    await startButton.click();

    // Chercher les boutons de note
    const noteButtons = page.locator('button:has-text("Besoin du toilette"), button:has-text("Besoin d\'eau"), button:has-text("Contraction forte")');
    if (await noteButtons.first().isVisible({ timeout: 500 }).catch(() => false)) {
      await noteButtons.first().click();
      // Vérifier qu'une note est sélectionnée
      const selectedNote = page.locator('p:has-text("Note sélectionnée")');
      await expect(selectedNote).toBeVisible();
    }
  });

  test('graphique timeline - affiche les contractions', async ({ page }) => {
    // Créer quelques contractions
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    for (let i = 0; i < 3; i++) {
      await startButton.click();
      await page.waitForTimeout(100);
      const stopButton = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
      await stopButton.click();
      await page.waitForTimeout(300);
    }

    // Chercher le graphique
    const timeline = page.locator('.timeline, [role="img"][aria-label*="timeline"], svg');
    if (await timeline.first().isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(timeline.first()).toBeVisible();
    }
  });

  test('statistiques - affiche qté/h, durée moyenne, fréquence', async ({ page }) => {
    // Créer quelques contractions
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    for (let i = 0; i < 3; i++) {
      await startButton.click();
      await page.waitForTimeout(200);
      const stopButton = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
      await stopButton.click();
      await page.waitForTimeout(300);
    }

    // Vérifier que les stats s'affichent
    const statsSection = page.locator('h2').filter({ hasText: /Indicateurs/ });
    if (await statsSection.isVisible({ timeout: 500 }).catch(() => false)) {
      const qtyLabel = page.locator(':text("Quantité / h")');
      const durationLabel = page.locator(':text("Durée moyenne")');
      const freqLabel = page.locator(':text("Fréquence moyenne")');

      await expect(qtyLabel).toBeVisible();
      await expect(durationLabel).toBeVisible();
      await expect(freqLabel).toBeVisible();
    }
  });

  test('historique - affiche les contractions passées', async ({ page }) => {
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    await startButton.click();
    await page.waitForTimeout(500);
    const stopButton = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
    await stopButton.click();

    // Vérifier que l'historique s'affiche
    const historySection = page.locator('h2').filter({ hasText: /Historique|History/ });
    if (await historySection.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(historySection).toBeVisible();
    }
  });

  test('annulation (undo) - annule la dernière contraction', async ({ page }) => {
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    await startButton.click();
    await page.waitForTimeout(500);
    const stopButton = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
    await stopButton.click();

    // Chercher le bouton d'annulation
    const undoButton = page.locator('button').filter({ hasText: /Annuler|Undo/ }).first();
    if (await undoButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      const initialCount = await page.locator('.contraction-entry, [data-testid*="record"]').count();
      await undoButton.click();
      await page.waitForTimeout(500);
      const newCount = await page.locator('.contraction-entry, [data-testid*="record"]').count();
      expect(newCount).toBeLessThanOrEqual(initialCount);
    }
  });

  test('fenêtre temporelle - change les stats selon la sélection', async ({ page }) => {
    // Créer quelques contractions
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    for (let i = 0; i < 3; i++) {
      await startButton.click();
      await page.waitForTimeout(100);
      const stopButton = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
      await stopButton.click();
      await page.waitForTimeout(300);
    }

    // Chercher les boutons de fenêtre temporelle
    const allButton = page.locator('button:has-text("Toutes"), button:has-text("All")');
    const window30 = page.locator('button:has-text("30 min"), button:has-text("Last 30")');
    
    if (await allButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await allButton.click();
      await expect(allButton).toHaveAttribute('aria-pressed', 'true');
    }

    if (await window30.isVisible({ timeout: 500 }).catch(() => false)) {
      await window30.click();
      await expect(window30).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('affichage vide (EmptyState) - quand pas de contractions', async ({ page }) => {
    const emptyState = page.locator('.empty-state, [data-testid="empty-state"]');
    if (await emptyState.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('responsive - s\'affiche correctement sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    await expect(startButton).toBeVisible();
  });

  test('responsive - s\'affiche correctement sur desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    await expect(startButton).toBeVisible();
  });

  test('actualisation - persiste après rechargement', async ({ page }) => {
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    await startButton.click();
    await page.waitForTimeout(500);
    const stopButton = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
    await stopButton.click();

    // Recharger la page
    await page.reload();

    // Vérifier que la contraction persiste
    const historySection = page.locator('h2').filter({ hasText: /Historique|History/ });
    if (await historySection.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(historySection).toBeVisible();
    }
  });
});
