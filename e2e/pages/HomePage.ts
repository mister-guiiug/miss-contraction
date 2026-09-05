/**
 * Page Object pour HomeView
 */

import { Page, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS, QUICK_NOTES } from '../config';
import {
  createContraction,
  getDisplayedStats,
  getThresholdBadgeState,
} from '../helpers';

export class HomePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Le bouton début / fin — il n'y en a qu'un, il bascule.
   *
   * `getStartButton` et `getStopButton` visaient deux `data-testid` distincts
   * qui n'ont jamais existé dans l'application.
   */
  getToggleButton() {
    return this.page.locator(SELECTORS.TOGGLE_BTN);
  }

  /** L'enregistrement est-il en cours ? La classe `recording` le dit. */
  async isRecording() {
    return await this.page
      .locator(SELECTORS.TOGGLE_BTN_RECORDING)
      .isVisible({ timeout: TIMEOUTS.SHORT })
      .catch(() => false);
  }

  async startContraction() {
    await this.getToggleButton().click();
    await expect(this.page.locator(SELECTORS.TOGGLE_BTN_RECORDING)).toBeVisible(
      { timeout: TIMEOUTS.ELEMENT_READY }
    );
  }

  async stopContraction() {
    await this.getToggleButton().click();
    await expect(this.page.locator(SELECTORS.TOGGLE_BTN_RECORDING)).toBeHidden({
      timeout: TIMEOUTS.ELEMENT_READY,
    });
  }

  async createContraction(durationMs = 500) {
    await createContraction(this.page, durationMs);
  }

  async getTimerDisplay() {
    return await this.page.locator(SELECTORS.TIMER_VALUE).textContent();
  }

  async getStats() {
    return await getDisplayedStats(this.page);
  }

  async getThresholdBadge() {
    return await getThresholdBadgeState(this.page);
  }

  /** Les niveaux du sélecteur d'intensité : `intensity-option-<n>`. */
  async selectIntensity(level: number) {
    const btn = this.page.locator(`[data-testid="intensity-option-${level}"]`);
    await expect(btn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await btn.click();
  }

  /**
   * Les notes rapides n'ont pas de `data-testid` : elles portent une classe
   * par identifiant (`note-tag--waters`, …). On désigne donc la note par son
   * identifiant, pas par son libellé — celui-ci est traduit en sept langues,
   * et le sélecteur `[data-note="…"]` visé auparavant n'existe pas.
   */
  async selectQuickNote(note: keyof typeof QUICK_NOTES) {
    const btn = this.page.locator(QUICK_NOTES[note]);
    await expect(btn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await btn.click();
  }

  async getHistoryEntries() {
    return await this.page.locator(`${SELECTORS.HISTORY_ITEMS} > li`).count();
  }

  /** Le bandeau « Enregistré ! » et son annulation vivent dans `Banners`. */
  async clickUndo() {
    const undoBtn = this.page.locator('#btn-undo-add');
    if (
      await undoBtn.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)
    ) {
      await undoBtn.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * L'état vide RÉEL est celui du socle. `history-empty`, que cette méthode
   * visait, appartient à `HistoryList` — que `HomeView` ne monte même pas
   * lorsqu'il n'y a aucune contraction. Elle rendait donc toujours `false`.
   */
  async isEmptyStateVisible() {
    return await this.page
      .locator(SELECTORS.EMPTY_STATE)
      .isVisible({ timeout: TIMEOUTS.SHORT })
      .catch(() => false);
  }
}
