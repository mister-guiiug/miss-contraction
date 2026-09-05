/**
 * Page Object pour SettingsView
 *
 * LES BASCULES SONT DES CASES À COCHER, PAS DES BOUTONS `*-toggle`. Aucun des
 * cinq `[data-testid="…-toggle"]` visés ici n'existe : l'écran de réglages
 * rend des `<input type="checkbox">` dont les crochets se terminent par
 * `-check`. Le contraste élevé et le thème n'ont même pas de `data-testid` —
 * ils portent un `id`, respectivement dans `HighContrastToggle` et `Shell`.
 */

import { Page, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS, ROUTES } from '../config';
import { updateSetting, saveSettings, toggleCheckbox } from '../helpers';

export class SettingsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(ROUTES.SETTINGS);
    await this.page.waitForLoadState('networkidle');
  }

  async setMaxInterval(value: number) {
    await updateSetting(this.page, SELECTORS.MAX_INTERVAL_INPUT, value);
  }

  async setMinDuration(value: number) {
    await updateSetting(this.page, SELECTORS.MIN_DURATION_INPUT, value);
  }

  async setConsecutiveCount(value: number) {
    await updateSetting(this.page, SELECTORS.CONSECUTIVE_COUNT_INPUT, value);
  }

  async setMaternityName(value: string) {
    await updateSetting(this.page, SELECTORS.MATERNITY_LABEL_INPUT, value);
  }

  async setMaternityPhone(value: string) {
    await updateSetting(this.page, SELECTORS.MATERNITY_PHONE_INPUT, value);
  }

  async setMaternityAddress(value: string) {
    await updateSetting(this.page, SELECTORS.MATERNITY_ADDRESS_TEXTAREA, value);
  }

  /**
   * La fenêtre de calcul des statistiques est un `<select>` de cet écran — pas
   * une rangée de boutons sur l'accueil, comme le supposait
   * `HomePage.selectTimeWindow`.
   */
  async setStatsWindow(value: 'all' | '30' | '60' | '120') {
    const select = this.page.locator(SELECTORS.STATS_WINDOW_SELECT);
    await expect(select).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await select.selectOption(value);
  }

  async save() {
    await saveSettings(this.page);
  }

  /** Le bouton de thème vit dans l'en-tête, et porte un `id`. */
  async toggleTheme() {
    const btn = this.page.locator('#btn-theme');
    await expect(btn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await btn.click();
  }

  async toggleHighContrast() {
    return await toggleCheckbox(this.page, '#high-contrast-check');
  }

  async toggleLargeMode() {
    return await toggleCheckbox(this.page, '[data-testid="large-mode-check"]');
  }

  async toggleVibration() {
    return await toggleCheckbox(this.page, '[data-testid="vibration-check"]');
  }

  async toggleVoiceCommands() {
    return await toggleCheckbox(
      this.page,
      '[data-testid="voice-commands-check"]'
    );
  }

  async snooze(minutes: 30 | 60) {
    const snoozeBtn = this.page.locator(
      `[data-testid="snooze-${minutes}min-btn"]`
    );
    await expect(snoozeBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await snoozeBtn.click();
  }

  async cancelSnooze() {
    const cancelBtn = this.page.locator('[data-testid="clear-snooze-btn"]');
    if (
      await cancelBtn.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)
    ) {
      await cancelBtn.click();
    }
  }

  async requestNotificationPermission() {
    const btn = this.page.locator('[data-testid="request-notification-btn"]');
    if (await btn.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      await btn.click();
    }
  }

  /**
   * L'effacement des données est sur l'accueil, dans l'en-tête de
   * l'historique — pas dans les réglages. Il ouvre une `confirm()` native :
   * l'écouteur doit être posé AVANT le clic, sinon le dialogue reste ouvert et
   * le clic n'aboutit jamais.
   */
  async clearAllData() {
    await this.page.goto(ROUTES.HOME);
    await this.page.waitForLoadState('networkidle');

    const deleteBtn = this.page.locator(SELECTORS.CLEAR_HISTORY_BTN);
    if (
      await deleteBtn.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)
    ) {
      this.page.once('dialog', dialog => dialog.accept());
      await deleteBtn.click();
    }
  }

  async getSaveConfirmation() {
    return await this.page
      .locator(SELECTORS.SETTINGS_SAVE_FEEDBACK)
      .textContent();
  }
}
