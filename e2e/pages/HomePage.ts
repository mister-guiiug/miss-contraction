/**
 * Page Object pour HomeView
 */

import { Page, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from '../config';
import { createContraction, getDisplayedStats, getThresholdBadgeState } from '../helpers';

export class HomePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async getStartButton() {
    return this.page.locator(SELECTORS.START_BTN);
  }

  async getStopButton() {
    return this.page.locator(SELECTORS.STOP_BTN);
  }

  async startContraction() {
    const btn = await this.getStartButton();
    await expect(btn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await btn.click();
  }

  async stopContraction() {
    const btn = await this.getStopButton();
    await expect(btn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await btn.click();
    await this.page.waitForTimeout(200);
  }

  async createContraction(durationMs = 500) {
    await createContraction(this.page, durationMs);
  }

  async getTimerDisplay() {
    const timer = this.page.locator(SELECTORS.TIMER_DISPLAY);
    return await timer.textContent();
  }

  async getStats() {
    return await getDisplayedStats(this.page);
  }

  async getThresholdBadge() {
    return await getThresholdBadgeState(this.page);
  }

  async selectIntensity(level: number) {
    const intensityBtn = this.page.locator(`[data-testid="intensity-${level}"]`);
    await expect(intensityBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await intensityBtn.click();
  }

  async selectQuickNote(noteText: string) {
    const noteBtn = this.page.locator(`[data-testid="quick-note"][data-note="${noteText}"]`);
    await expect(noteBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await noteBtn.click();
  }

  async selectTimeWindow(window: '30' | '60' | '120' | 'all') {
    const btn = this.page.locator(`[data-testid="time-window-${window}"]`);
    await expect(btn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await btn.click();
  }

  async getHistoryEntries() {
    return await this.page.locator(SELECTORS.CONTRACTION_ENTRY).count();
  }

  async clickUndo() {
    const undoBtn = this.page.locator('[data-testid="undo-btn"]');
    if (await undoBtn.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      await undoBtn.click();
      await this.page.waitForTimeout(300);
    }
  }

  async isEmptyStateVisible() {
    const emptyState = this.page.locator('[data-testid="empty-state"]');
    return await emptyState.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false);
  }
}
