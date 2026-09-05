/**
 * Tests E2E - TableView
 *
 * ── CE FICHIER A ÉTÉ RÉÉCRIT, ET IL A BEAUCOUP MAIGRI ────────────────────────
 *
 * Il comptait dix-huit tests dont ONZE ne vérifiaient rien : ils étaient
 * enveloppés dans `if (await x.isVisible().catch(() => false)) { … }`, si bien
 * qu'un élément absent faisait passer le test au lieu de l'échouer. Cinq
 * d'entre eux visaient des fonctions que `TableView` n'a pas — édition,
 * suppression, tri par colonne, pagination, export. Le tableau est en lecture
 * seule : l'édition et la suppression se font sur l'accueil, dans la liste
 * d'historique. Ces cinq-là sont supprimés plutôt que maquillés.
 *
 * LE `beforeEach` ENREGISTRAIT TROIS CONTRACTIONS EN CLIQUANT LE CHRONOMÈTRE,
 * puis cherchait un lien de navigation avec
 * `a[href="/historique"], a[href*="table"]`. Ce sélecteur attrapait d'abord le
 * lien du TIROIR fermé, invisible aux yeux de l'utilisateur mais « visible et
 * stable » pour Playwright : le clic partait dans le vide et emportait les
 * dix-huit tests en timeout. On sème désormais l'état directement dans
 * `localStorage` — c'est déterministe, et six secondes de moins par test.
 */

import { test, expect } from '@playwright/test';
import { ROUTES, SELECTORS } from './config';
import { KEY_RECORDS } from './config';

/** Trois contractions d'une minute, espacées de six minutes. */
const SEEDED = [
  { id: 't1', start: 0, end: 60_000, note: 'Première note' },
  { id: 't2', start: 360_000, end: 420_000, intensity: 3 },
  { id: 't3', start: 720_000, end: 780_000 },
];

async function seed(page: import('@playwright/test').Page, count = 3) {
  const base = Date.now() - 3_600_000;
  const records = SEEDED.slice(0, count).map(r => ({
    ...r,
    start: base + r.start,
    end: base + r.end,
  }));
  await page.goto(ROUTES.HOME);
  await page.evaluate(
    ([key, value]) => {
      localStorage.clear();
      localStorage.setItem(key as string, JSON.stringify(value));
    },
    [KEY_RECORDS, records] as const
  );
  await page.goto(ROUTES.TABLE);
  await page.waitForLoadState('networkidle');
}

test.describe('TableView - Tableau des contractions', () => {
  test.beforeEach(async ({ page }) => {
    await seed(page);
  });

  test('affiche le tableau des contractions', async ({ page }) => {
    await expect(page.locator(SELECTORS.TABLE_SECTION)).toBeVisible();
    await expect(page.locator(SELECTORS.CONTRACTIONS_TABLE)).toBeVisible();
  });

  test('tableau - affiche les six colonnes attendues', async ({ page }) => {
    const headers = await page
      .locator(`${SELECTORS.CONTRACTIONS_TABLE} thead th`)
      .allTextContents();

    // Les libellés viennent de `table.col.*` ; la locale est fixée à fr-FR
    // dans `playwright.config.ts`, ils sont donc stables.
    expect(headers).toEqual([
      'N°',
      'Début',
      'Durée',
      'Intervalle',
      'Fréquence',
      'Note',
    ]);
  });

  test('tableau - une ligne par contraction enregistrée', async ({ page }) => {
    await expect(
      page.locator(`${SELECTORS.CONTRACTIONS_TABLE} tbody tr`)
    ).toHaveCount(3);
  });

  test('tableau - la première colonne numérote les lignes', async ({
    page,
  }) => {
    const nums = await page
      .locator(`${SELECTORS.CONTRACTIONS_TABLE} tbody th`)
      .allTextContents();
    expect(nums).toEqual(['1', '2', '3']);
  });

  test('tableau - affiche heure de début et durée', async ({ page }) => {
    const dates = await page
      .locator('[data-testid="table-cell-date"]')
      .allTextContents();
    const durations = await page
      .locator('[data-testid="table-cell-duration"]')
      .allTextContents();

    // Chaque ligne porte une heure, et une durée d'une minute exactement,
    // rendue au format `m:ss`.
    expect(dates).toHaveLength(3);
    for (const d of dates) expect(d).toMatch(/\d{1,2}:\d{2}/);
    expect(durations).toEqual(['1:00', '1:00', '1:00']);
  });

  test('tableau - intervalle vide sur la première ligne, six minutes ensuite', async ({
    page,
  }) => {
    const intervals = await page
      .locator('[data-testid="table-cell-interval"]')
      .allTextContents();

    expect(intervals).toHaveLength(3);
    // La première contraction n'a pas de précédente : l'écart n'existe pas.
    expect(intervals[0]).toMatch(/^[-–—\s]*$/);
    expect(intervals[1]).toMatch(/6/);
    expect(intervals[2]).toMatch(/6/);
  });

  test('tableau - la note et l’intensité sont rendues', async ({ page }) => {
    const notes = await page
      .locator('[data-testid="table-cell-note"]')
      .allTextContents();

    expect(notes[0]).toContain('Première note');
    // L'intensité est suffixée au texte de la note : `[Int. 3]`.
    expect(notes[1]).toContain('[Int. 3]');
    // Sans note ni intensité, la cellule affiche un tiret cadratin.
    expect(notes[2]?.trim()).toBe('—');
  });

  test('tableau - message dédié quand il n’y a rien à afficher', async ({
    page,
  }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await page.goto(ROUTES.TABLE);
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SELECTORS.TABLE_EMPTY)).toBeVisible();
    await expect(page.locator(SELECTORS.TABLE_EMPTY)).toContainText('Aucune');
    await expect(page.locator(SELECTORS.CONTRACTIONS_TABLE)).toHaveCount(0);
  });

  test('tableau - responsive sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator(SELECTORS.CONTRACTIONS_TABLE)).toBeVisible();
    await expect(
      page.locator(`${SELECTORS.CONTRACTIONS_TABLE} tbody tr`)
    ).toHaveCount(3);
  });

  test('tableau - responsive sur desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator(SELECTORS.CONTRACTIONS_TABLE)).toBeVisible();
    await expect(
      page.locator(`${SELECTORS.CONTRACTIONS_TABLE} tbody tr`)
    ).toHaveCount(3);
  });

  test('tableau - persistance après rechargement', async ({ page }) => {
    const rows = page.locator(`${SELECTORS.CONTRACTIONS_TABLE} tbody tr`);
    await expect(rows).toHaveCount(3);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(rows).toHaveCount(3);
  });
});
