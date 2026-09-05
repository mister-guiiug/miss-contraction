/**
 * Page Object pour navigation et Shell communs
 *
 * LES CINQ MÉTHODES ÉTAIENT IDENTIQUES, ET TOUTES INUTILES À MOITIÉ. Chacune
 * cherchait un `[data-testid="nav-…"]`, attendait qu'il devienne visible, puis
 * retombait sur `page.goto`. Aucun de ces cinq crochets n'existe : la barre
 * basse vient de `react/bottom-nav` du socle, qui n'expose que des
 * `[data-dwc]` et ne donne aucune prise par onglet. Le détour retombait donc
 * toujours, après avoir consommé une temporisation à chaque fois.
 *
 * On va droit à l'URL. `clickNavLink` reste disponible pour les tests qui
 * éprouvent la navigation elle-même.
 */

import { Page } from '@playwright/test';
import { SELECTORS, TIMEOUTS, ROUTES } from '../config';
import { navigateTo, clickNavLink } from '../helpers';

export class Shell {
  constructor(private page: Page) {}

  async navigateToHome() {
    await navigateTo(this.page, ROUTES.HOME);
  }

  async navigateToSettings() {
    await navigateTo(this.page, ROUTES.SETTINGS);
  }

  async navigateToTable() {
    await navigateTo(this.page, ROUTES.TABLE);
  }

  async navigateToMaternity() {
    await navigateTo(this.page, ROUTES.MATERNITY);
  }

  async navigateToMessage() {
    await navigateTo(this.page, ROUTES.MESSAGE);
  }

  /** Passer par la barre basse, pour éprouver la navigation elle-même. */
  async clickBottomNav(route: string) {
    await clickNavLink(this.page, route);
  }

  async getPageTitle() {
    return await this.page.title();
  }

  async isNavigationVisible() {
    return await this.page
      .locator(SELECTORS.BOTTOM_NAV)
      .isVisible({ timeout: TIMEOUTS.SHORT })
      .catch(() => false);
  }

  async getNavigationItems() {
    return await this.page.locator(SELECTORS.BOTTOM_NAV_ITEM).count();
  }
}
