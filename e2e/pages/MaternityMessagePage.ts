/**
 * Page Object pour MaternityView et MessageView
 *
 * TOUS LES CROCHETS VISÉS ICI ÉTAIENT FAUX. `maternity-name`,
 * `maternity-phone-link`, `maternity-directions-link`, `maternity-instructions`,
 * `copy-message-btn`, `copy-confirmation`, `share-whatsapp-link`,
 * `share-sms-link` : aucun n'existe dans `src/`. Les vrais suivent la
 * convention `<vue>-<élément>` (`maternity-label`, `message-copy-btn`, …).
 *
 * `getInstructions` a disparu : `MaternityView` n'affiche pas d'instructions,
 * et le réglage correspondant n'existe pas non plus.
 */

import { Page, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS, ROUTES } from '../config';

export class MaternityPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(ROUTES.MATERNITY);
    await this.page.waitForLoadState('networkidle');
  }

  async getMaternityName() {
    return await this.page.locator(SELECTORS.MATERNITY_LABEL).textContent();
  }

  /**
   * Le téléphone est rendu à deux endroits : le texte
   * (`maternity-phone`) et le bouton d'appel qui porte le `tel:`
   * (`maternity-call-btn`). Quand aucun numéro n'est réglé, ni l'un ni l'autre
   * n'est monté — c'est `maternity-phone-placeholder` qui prend la place.
   */
  async getMaternityPhone() {
    const link = this.page.locator(SELECTORS.MATERNITY_CALL_BTN);
    return {
      href: await link.getAttribute('href'),
      text: await this.page
        .locator('[data-testid="maternity-phone"]')
        .textContent(),
    };
  }

  async getMaternityAddress() {
    return await this.page
      .locator('[data-testid="maternity-address"]')
      .textContent();
  }

  async callMaternity() {
    return await this.page
      .locator(SELECTORS.MATERNITY_CALL_BTN)
      .getAttribute('href');
  }

  async getDirectionsLink() {
    return await this.page
      .locator(SELECTORS.MATERNITY_MAPS_BTN)
      .getAttribute('href');
  }
}

export class MessagePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(ROUTES.MESSAGE);
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
    const copyBtn = this.page.locator(SELECTORS.MESSAGE_COPY_BTN);
    await expect(copyBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await copyBtn.click();

    await expect(this.page.locator(SELECTORS.MESSAGE_FEEDBACK)).toBeVisible({
      timeout: TIMEOUTS.NORMAL,
    });
  }

  async getWhatsAppLink() {
    return await this.page
      .locator(SELECTORS.MESSAGE_WHATSAPP_BTN)
      .getAttribute('href');
  }

  async getSMSLink() {
    return await this.page
      .locator(SELECTORS.MESSAGE_SMS_BTN)
      .getAttribute('href');
  }
}
