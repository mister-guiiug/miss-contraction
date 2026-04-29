/**
 * Page Object pour TableView
 */

import { Page, expect } from '@playwright/test';
import { SELECTORS, TIMEOUTS } from '../config';

export class TablePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/historique');
    await this.page.waitForLoadState('networkidle');
  }

  async getRowCount() {
    return await this.page.locator('[data-testid="contraction-table-row"]').count();
  }

  async getTableHeaders() {
    return await this.page.locator('th, [role="columnheader"]').allTextContents();
  }

  async editContraction(rowIndex: number) {
    const editBtn = this.page
      .locator('[data-testid="contraction-table-row"]')
      .nth(rowIndex)
      .locator('[data-testid="edit-btn"]');

    await expect(editBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await editBtn.click();

    // Attendre la modale
    const modal = this.page.locator('[data-testid="edit-contraction-modal"]');
    await expect(modal).toBeVisible({ timeout: TIMEOUTS.NORMAL });

    return modal;
  }

  async deleteContraction(rowIndex: number) {
    const deleteBtn = this.page
      .locator('[data-testid="contraction-table-row"]')
      .nth(rowIndex)
      .locator('[data-testid="delete-btn"]');

    await expect(deleteBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await deleteBtn.click();

    // Gérer la confirmation
    this.page.once('dialog', dialog => {
      dialog.accept();
    });

    await this.page.waitForTimeout(300);
  }

  async updateNoteInModal(newNote: string) {
    const modal = this.page.locator('[data-testid="edit-contraction-modal"]');
    const noteInput = modal.locator('[data-testid="contraction-note-input"]');
    
    await expect(noteInput).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await noteInput.fill(newNote);

    const saveBtn = modal.locator('[data-testid="modal-save-btn"]');
    await expect(saveBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await saveBtn.click();

    await this.page.waitForTimeout(300);
  }

  async sortByColumn(columnName: string) {
    const header = this.page.locator(`[data-testid="header-${columnName}"]`);
    await expect(header).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await header.click();
  }

  async export() {
    const exportBtn = this.page.locator(SELECTORS.EXPORT_BTN);
    
    if (await exportBtn.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      const downloadPromise = this.page.waitForEvent('download');
      await exportBtn.click();
      return await downloadPromise;
    }

    return null;
  }

  async hasEmptyState() {
    const emptyMsg = this.page.locator('[data-testid="empty-table-message"]');
    return await emptyMsg.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false);
  }

  async getRowData(rowIndex: number) {
    const row = this.page.locator('[data-testid="contraction-table-row"]').nth(rowIndex);
    return {
      time: await row.locator('[data-col="time"]').textContent(),
      duration: await row.locator('[data-col="duration"]').textContent(),
      interval: await row.locator('[data-col="interval"]').textContent(),
      frequency: await row.locator('[data-col="frequency"]').textContent(),
      note: await row.locator('[data-col="note"]').textContent(),
    };
  }
}
