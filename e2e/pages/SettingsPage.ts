/**
 * Page Object pour SettingsView
 */

import { Page, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from '../config';
import { updateSetting, saveSettings, toggleCheckbox } from '../helpers';

export class SettingsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/parametres');
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
    await updateSetting(this.page, SELECTORS.MATERNITY_NAME_INPUT, value);
  }

  async setMaternityPhone(value: string) {
    await updateSetting(this.page, SELECTORS.MATERNITY_PHONE_INPUT, value);
  }

  async setMaternityAddress(value: string) {
    await updateSetting(this.page, SELECTORS.MATERNITY_ADDRESS_INPUT, value);
  }

  async save() {
    await saveSettings(this.page);
  }

  async toggleTheme() {
    return await toggleCheckbox(this.page, '[data-testid="theme-toggle"]');
  }

  async toggleHighContrast() {
    return await toggleCheckbox(this.page, '[data-testid="high-contrast-toggle"]');
  }

  async toggleLargeMode() {
    return await toggleCheckbox(this.page, '[data-testid="large-mode-toggle"]');
  }

  async toggleVibration() {
    return await toggleCheckbox(this.page, '[data-testid="vibration-toggle"]');
  }

  async toggleVoiceCommands() {
    return await toggleCheckbox(this.page, '[data-testid="voice-commands-toggle"]');
  }

  async snooze(minutes: 30 | 60) {
    const snoozeBtn = this.page.locator(`[data-testid="snooze-${minutes}-btn"]`);
    await expect(snoozeBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await snoozeBtn.click();
  }

  async cancelSnooze() {
    const cancelBtn = this.page.locator('[data-testid="cancel-snooze-btn"]');
    if (await cancelBtn.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      await cancelBtn.click();
    }
  }

  async requestNotificationPermission() {
    const btn = this.page.locator('[data-testid="request-notification-btn"]');
    if (await btn.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      await btn.click();
    }
  }

  async clearAllData() {
    const deleteBtn = this.page.locator('[data-testid="clear-data-btn"]');
    if (await deleteBtn.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      await deleteBtn.click();
      
      // Gérer la confirmation
      this.page.once('dialog', dialog => {
        dialog.accept();
      });
    }
  }

  async getSaveConfirmation() {
    const msg = this.page.locator('[data-testid="save-confirmation"]');
    return await msg.textContent();
  }
}
