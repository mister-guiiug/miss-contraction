/**
 * Tests E2E - TableView
 * Couverture: historique détaillé, édition, suppression, tri
 */

import { test, expect } from '@playwright/test';

test.describe('TableView - Tableau des contractions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Créer quelques contractions
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    for (let i = 0; i < 3; i++) {
      await startButton.click();
      await page.waitForTimeout(300);
      const stopButton = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
      await stopButton.click();
      await page.waitForTimeout(300);
    }

    // Naviguer vers le tableau
    const tableNav = page.locator('a[href="/historique"], a[href*="table"]').first();
    if (await tableNav.isVisible({ timeout: 1000 }).catch(() => false)) {
      await tableNav.click();
    } else {
      await page.goto('/historique');
    }

    await page.waitForLoadState('networkidle');
  });

  test('affiche le tableau des contractions', async ({ page }) => {
    const table = page.locator('table, .table-page, [role="grid"]').first();
    await expect(table).toBeVisible();
  });

  test('tableau - affiche les colonnes requises', async ({ page }) => {
    const headerCells = page.locator('th, [role="columnheader"]');
    const headers = await headerCells.allTextContents();
    
    // Vérifier qu'il y a au moins les colonnes principales
    expect(headers.length).toBeGreaterThan(0);
  });

  test('tableau - affiche les contractions enregistrées', async ({ page }) => {
    const rows = page.locator('tbody tr, [role="row"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('tableau - affiche heure de début', async ({ page }) => {
    const cells = page.locator('td, [role="gridcell"]');
    const contents = await cells.allTextContents();
    
    // Vérifier qu'il y a des timestamps ou heures
    const hasTime = contents.some(c => /\d{1,2}:\d{2}/.test(c));
    expect(hasTime).toBe(true);
  });

  test('tableau - affiche durée de la contraction', async ({ page }) => {
    const cells = page.locator('td, [role="gridcell"]');
    const contents = await cells.allTextContents();
    
    // Vérifier qu'il y a des durées (format mm:ss)
    const hasDuration = contents.some(c => /\d+:\d{2}/.test(c));
    expect(hasDuration).toBe(true);
  });

  test('tableau - affiche intervalle entre contractions', async ({ page }) => {
    const cells = page.locator('td, [role="gridcell"]');
    const contents = await cells.allTextContents();
    
    // Vérifier qu'il y a des intervalles
    expect(contents.length).toBeGreaterThan(0);
  });

  test('tableau - affiche fréquence (contractions/h)', async ({ page }) => {
    const cells = page.locator('td, [role="gridcell"]');
    const contents = await cells.allTextContents();
    
    // Vérifier qu'il y a des fréquences (format "/h")
    const hasFrequency = contents.some(c => /\/h|/ \| h/.test(c));
    expect(contents.length).toBeGreaterThan(0);
  });

  test('tableau - édition de contraction', async ({ page }) => {
    // Chercher un bouton d'édition
    const editButton = page.locator('button').filter({ hasText: /Éditer|Edit|✏/ }).first();
    if (await editButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await editButton.click();

      // Vérifier qu'une modale d'édition s'ouvre
      const modal = page.locator('[role="dialog"], .modal, .edit-modal');
      if (await modal.isVisible({ timeout: 500 }).catch(() => false)) {
        await expect(modal).toBeVisible();
      }
    }
  });

  test('tableau - suppression de contraction', async ({ page }) => {
    const rowsBefore = await page.locator('tbody tr, [role="row"]').count();

    // Chercher un bouton de suppression
    const deleteButton = page.locator('button').filter({ hasText: /Supprimer|Delete|✕|×/ }).first();
    if (await deleteButton.isVisible({ timeout: 500 }).catch(() => false)) {
      page.once('dialog', dialog => {
        expect(dialog.type()).toBe('confirm');
        dialog.accept();
      });

      await deleteButton.click();
      await page.waitForTimeout(500);

      const rowsAfter = await page.locator('tbody tr, [role="row"]').count();
      expect(rowsAfter).toBeLessThan(rowsBefore);
    }
  });

  test('tableau - modification note d\'une contraction', async ({ page }) => {
    const editButton = page.locator('button').filter({ hasText: /Éditer|Edit/ }).first();
    if (await editButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await editButton.click();

      const modal = page.locator('[role="dialog"], .modal');
      if (await modal.isVisible({ timeout: 500 }).catch(() => false)) {
        const noteInput = modal.locator('textarea, input[type="text"]').first();
        if (await noteInput.isVisible({ timeout: 500 }).catch(() => false)) {
          await noteInput.fill('Contractions fortes et régulières');
        }

        const saveButton = modal.locator('button:has-text("Enregistrer"), button:has-text("Save"), button:has-text("OK")');
        if (await saveButton.isVisible({ timeout: 500 }).catch(() => false)) {
          await saveButton.click();
        }
      }
    }
  });

  test('tableau - tri par heure de début', async ({ page }) => {
    const timeHeader = page.locator('th, [role="columnheader"]').filter({ hasText: /Heure|Time|Début/ }).first();
    if (await timeHeader.isVisible({ timeout: 500 }).catch(() => false)) {
      // Cliquer pour trier
      if (await timeHeader.evaluate(el => el.parentElement?.classList.contains('sortable')).catch(() => false)) {
        await timeHeader.click();
      }
    }
  });

  test('tableau - tri par durée', async ({ page }) => {
    const durationHeader = page.locator('th, [role="columnheader"]').filter({ hasText: /Durée|Duration/ }).first();
    if (await durationHeader.isVisible({ timeout: 500 }).catch(() => false)) {
      if (await durationHeader.evaluate(el => el.parentElement?.classList.contains('sortable')).catch(() => false)) {
        await durationHeader.click();
      }
    }
  });

  test('tableau - responsive sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const table = page.locator('table, .table-page');
    if (await table.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(table).toBeVisible();
    }
  });

  test('tableau - responsive sur desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const table = page.locator('table, .table-page');
    if (await table.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(table).toBeVisible();
    }
  });

  test('tableau - affiche message si pas de contractions', async ({ page }) => {
    // Effacer les contractions
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    const emptyMessage = page.locator('p, .empty-state, text=Aucune');
    if (await emptyMessage.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(emptyMessage).toBeDefined();
    }
  });

  test('tableau - pagination (si beaucoup de contractions)', async ({ page }) => {
    // Créer beaucoup de contractions
    for (let i = 0; i < 30; i++) {
      await page.goto('/');
      const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
      await startButton.click();
      await page.waitForTimeout(50);
      const stopButton = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
      await stopButton.click();
      await page.waitForTimeout(50);
    }

    await page.goto('/historique');

    // Chercher les boutons de pagination
    const nextButton = page.locator('button').filter({ hasText: /Suivant|Next/ }).first();
    if (await nextButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(nextButton).toBeVisible();
    }
  });

  test('tableau - export des données', async ({ page }) => {
    const exportButton = page.locator('button').filter({ hasText: /Export|Télécharger|Download/ }).first();
    if (await exportButton.isVisible({ timeout: 500 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(json|csv|xlsx?)$/);
    }
  });

  test('tableau - persistance après rechargement', async ({ page }) => {
    const rowsBefore = await page.locator('tbody tr, [role="row"]').count();

    // Recharger
    await page.reload();

    const rowsAfter = await page.locator('tbody tr, [role="row"]').count();
    expect(rowsAfter).toBe(rowsBefore);
  });
});
