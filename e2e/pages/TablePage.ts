/**
 * Page Object pour TableView
 *
 * LE TABLEAU EST EN LECTURE SEULE. Ce Page Object exposait `editContraction`,
 * `deleteContraction`, `updateNoteInModal`, `sortByColumn` et `export` : rien
 * de tout cela n'existe dans `TableView`, qui ne rend qu'un `<table>` et un
 * lien de retour. L'édition et la suppression se font sur l'accueil, dans la
 * liste d'historique (`HomePage.editRecord` / `deleteRecord`).
 *
 * Les lignes portent `table-row-<id>`, pas `contraction-table-row`, et les
 * cellules `table-cell-<champ>`, pas `[data-col="…"]`.
 */

import { Page } from '@playwright/test';
import { SELECTORS, TIMEOUTS, ROUTES } from '../config';

export class TablePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(ROUTES.TABLE);
    await this.page.waitForLoadState('networkidle');
  }

  async getRowCount() {
    return await this.page
      .locator(`${SELECTORS.CONTRACTIONS_TABLE} tbody tr`)
      .count();
  }

  async getTableHeaders() {
    return await this.page
      .locator(`${SELECTORS.CONTRACTIONS_TABLE} thead th`)
      .allTextContents();
  }

  async hasEmptyState() {
    return await this.page
      .locator(SELECTORS.TABLE_EMPTY)
      .isVisible({ timeout: TIMEOUTS.SHORT })
      .catch(() => false);
  }

  async getRowData(rowIndex: number) {
    const row = this.page
      .locator(`${SELECTORS.CONTRACTIONS_TABLE} tbody tr`)
      .nth(rowIndex);
    return {
      date: await row.locator('[data-testid="table-cell-date"]').textContent(),
      duration: await row
        .locator('[data-testid="table-cell-duration"]')
        .textContent(),
      interval: await row
        .locator('[data-testid="table-cell-interval"]')
        .textContent(),
      frequency: await row
        .locator('[data-testid="table-cell-frequency"]')
        .textContent(),
      note: await row.locator('[data-testid="table-cell-note"]').textContent(),
    };
  }
}
