/**
 * Page Object pour navigation et Shell communs
 */

import { Page, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS, ROUTES } from '../config';

export class Shell {
  constructor(private page: Page) {}

  async navigateToHome() {
    const navBtn = this.page.locator(SELECTORS.NAV_HOME);
    if (await navBtn.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      await navBtn.click();
    } else {
      await this.page.goto(ROUTES.HOME);
    }
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToSettings() {
    const navBtn = this.page.locator(SELECTORS.NAV_SETTINGS);
    if (await navBtn.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      await navBtn.click();
    } else {
      await this.page.goto(ROUTES.SETTINGS);
    }
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToTable() {
    const navBtn = this.page.locator(SELECTORS.NAV_TABLE);
    if (await navBtn.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      await navBtn.click();
    } else {
      await this.page.goto(ROUTES.TABLE);
    }
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToMaternity() {
    const navBtn = this.page.locator(SELECTORS.NAV_MATERNITY);
    if (await navBtn.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      await navBtn.click();
    } else {
      await this.page.goto(ROUTES.MATERNITY);
    }
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToMessage() {
    const navBtn = this.page.locator(SELECTORS.NAV_MESSAGE);
    if (await navBtn.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      await navBtn.click();
    } else {
      await this.page.goto(ROUTES.MESSAGE);
    }
    await this.page.waitForLoadState('networkidle');
  }

  async getPageTitle() {
    return await this.page.title();
  }

  async isNavigationVisible() {
    const nav = this.page.locator('[data-testid="main-navigation"]');
    return await nav.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false);
  }

  async getNavigationItems() {
    return await this.page.locator('[data-testid*="nav-"]').count();
  }
}
