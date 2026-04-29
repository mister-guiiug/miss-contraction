/**
 * Page Object pour MaternityView et MessageView
 */

import { Page, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from '../config';

export class MaternityPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/maternite');
    await this.page.waitForLoadState('networkidle');
  }

  async getMaternityName() {
    const element = this.page.locator('[data-testid="maternity-name"]');
    return await element.textContent();
  }

  async getMaternityPhone() {
    const link = this.page.locator('[data-testid="maternity-phone-link"]');
    return {
      href: await link.getAttribute('href'),
      text: await link.textContent(),
    };
  }

  async getMaternityAddress() {
    const element = this.page.locator('[data-testid="maternity-address"]');
    return await element.textContent();
  }

  async getInstructions() {
    const element = this.page.locator('[data-testid="maternity-instructions"]');
    return await element.textContent();
  }

  async callMaternity() {
    const link = this.page.locator('[data-testid="maternity-phone-link"]');
    const href = await link.getAttribute('href');
    return href; // Retourne le href tel:...
  }

  async getDirectionsLink() {
    const link = this.page.locator('[data-testid="maternity-directions-link"]');
    return await link.getAttribute('href');
  }
}

export class MessagePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/message');
    await this.page.waitForLoadState('networkidle');
  }

  async getMessage() {
    const textarea = this.page.locator(SELECTORS.MESSAGE_TEXTAREA);
    await expect(textarea).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    return await textarea.inputValue();
  }

  async setMessage(text: string) {
    const textarea = this.page.locator(SELECTORS.MESSAGE_TEXTAREA);
    await expect(textarea).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await textarea.fill(text);
    await this.page.waitForTimeout(500); // Attendre la persistence
  }

  async copyMessage() {
    const copyBtn = this.page.locator('[data-testid="copy-message-btn"]');
    await expect(copyBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await copyBtn.click();

    const confirmation = this.page.locator('[data-testid="copy-confirmation"]');
    await expect(confirmation).toBeVisible({ timeout: TIMEOUTS.NORMAL }).catch(() => {
      // Confirmation optionnelle
    });
  }

  async getWhatsAppLink() {
    const link = this.page.locator('[data-testid="share-whatsapp-link"]');
    return await link.getAttribute('href');
  }

  async getSMSLink() {
    const link = this.page.locator('[data-testid="share-sms-link"]');
    return await link.getAttribute('href');
  }

  async shareViaWhatsApp() {
    const link = this.page.locator('[data-testid="share-whatsapp-link"]');
    if (await link.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      return await link.getAttribute('href');
    }
    return null;
  }

  async shareViaSMS() {
    const link = this.page.locator('[data-testid="share-sms-link"]');
    if (await link.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      return await link.getAttribute('href');
    }
    return null;
  }
}
