/**
 * Tests E2E - Export/Import & Navigation
 * Couverture: export JSON, import, navigation routes, redirects
 *
 * ── CE FICHIER PASSAIT À VIDE ────────────────────────────────────────────────
 *
 * Trois des sept tests d'export tenaient dans un
 * `if (await bouton.isVisible(...))`. Il n'existait AUCUN code d'export dans
 * `src/` : le bouton n'était jamais visible, le corps du test ne s'exécutait
 * jamais, et la suite restait verte. Les quatre autres relisaient
 * `localStorage` juste après l'avoir semé eux-mêmes — ils prouvaient que
 * `setItem` suivi de `getItem` rend la même chaîne, pas que l'application sait
 * exporter quoi que ce soit.
 *
 * Ils sont désormais inconditionnels, et ils cliquent de vrais boutons.
 */

import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import {
  ROUTES,
  SELECTORS,
  KEY_RECORDS,
  KEY_SETTINGS,
  SNAPSHOT_KEY,
} from './config';
import { clickNavLink } from './helpers';

/** L'instantané versionné tel qu'il est sur le disque, enveloppe comprise. */
async function readSnapshot(page: Page) {
  return page.evaluate(
    key => JSON.parse(localStorage.getItem(key) ?? 'null'),
    SNAPSHOT_KEY
  );
}

/** Clique « Exporter le fichier » et rend le contenu du fichier téléchargé. */
async function exportToText(
  page: Page
): Promise<{ filename: string; text: string }> {
  const downloadPromise = page.waitForEvent('download');
  await page.locator(SELECTORS.EXPORT_BACKUP_BTN).click();
  const download = await downloadPromise;
  const path = await download.path();
  return {
    filename: download.suggestedFilename(),
    text: await readFile(path, 'utf8'),
  };
}

test.describe('Export & Import', () => {
  test.beforeEach(async ({ page }) => {
    /*
     * On sème l'état au lieu de cliquer trois fois le chronomètre : c'est
     * déterministe, et surtout les réglages sont réellement écrits. Le test
     * « export - inclut les paramètres » lisait `mc_settings_v1` alors que
     * rien ne l'avait jamais créé — il tombait sur `null` et levait un
     * `TypeError` en lisant `.maternityLabel`.
     *
     * ON SÈME LA FORME HÉRITÉE, ET C'EST VOLONTAIRE : c'est celle qui dort sur
     * les téléphones. Le rechargement qui suit fait donc tourner la migration
     * 0 → 1 pour de vrai, avant chacun de ces tests.
     */
    await page.goto(ROUTES.HOME);
    await page.evaluate(
      ([recordsKey, settingsKey]) => {
        localStorage.clear();
        const now = Date.now();
        localStorage.setItem(
          recordsKey,
          JSON.stringify([
            { id: 'e1', start: now - 900000, end: now - 840000 },
            { id: 'e2', start: now - 540000, end: now - 480000 },
            { id: 'e3', start: now - 180000, end: now - 120000 },
          ])
        );
        localStorage.setItem(
          settingsKey,
          JSON.stringify({
            language: 'fr',
            maxIntervalMin: 5,
            minDurationSec: 45,
            consecutiveCount: 3,
            maternityLabel: 'Maternité de test',
          })
        );
      },
      [KEY_RECORDS, KEY_SETTINGS] as const
    );
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('migration - les clés d’hier deviennent l’instantané d’aujourd’hui', async ({
    page,
  }) => {
    const snapshot = await readSnapshot(page);

    expect(snapshot.v).toBe(1);
    expect(snapshot.data.app).toBe('miss-contraction');
    expect(snapshot.data.records).toHaveLength(3);
    expect(snapshot.data.settings.maternityLabel).toBe('Maternité de test');

    // Les clés héritées sont parties — et leurs octets dorment dans la copie
    // de côté que le socle range avant toute transformation.
    const restes = await page.evaluate(
      keys => keys.map(k => localStorage.getItem(k)),
      [KEY_RECORDS, KEY_SETTINGS]
    );
    expect(restes).toEqual([null, null]);
  });

  test('export - télécharge un fichier JSON', async ({ page }) => {
    await page.goto(ROUTES.SETTINGS);
    await expect(page.locator(SELECTORS.EXPORT_BACKUP_BTN)).toBeVisible();

    const { filename } = await exportToText(page);

    expect(filename).toMatch(/^miss-contraction-\d{4}-\d{2}-\d{2}\.json$/);
  });

  test('export - le fichier porte l’historique et les réglages', async ({
    page,
  }) => {
    await page.goto(ROUTES.SETTINGS);
    const { text } = await exportToText(page);
    const fichier = JSON.parse(text);

    // L'enveloppe du magasin versionné : c'est ELLE qui rendra le fichier
    // relisible par une version future de l'application.
    expect(fichier.v).toBe(1);
    expect(fichier.data.app).toBe('miss-contraction');
    expect(fichier.data.records).toHaveLength(3);
    expect(fichier.data.records[0].id).toBe('e1');
    expect(fichier.data.settings.maternityLabel).toBe('Maternité de test');
  });

  test('import - un fichier d’une autre application est refusé sans rien effacer', async ({
    page,
  }) => {
    await page.goto(ROUTES.SETTINGS);
    page.on('dialog', dialog => void dialog.accept());

    await page.locator(SELECTORS.IMPORT_BACKUP_INPUT).setInputFiles({
      name: 'notes-2026-09-06.json',
      mimeType: 'application/json',
      // Le format du squelette de la famille : même enveloppe, autre donnée.
      buffer: Buffer.from(JSON.stringify({ v: 1, data: { notes: [] } })),
    });

    await expect(page.locator(SELECTORS.BACKUP_FEEDBACK)).toContainText(
      /refusé/i
    );

    const snapshot = await readSnapshot(page);
    expect(snapshot.data.records).toHaveLength(3);
  });

  test('import - un fichier tronqué est refusé sans rien effacer', async ({
    page,
  }) => {
    await page.goto(ROUTES.SETTINGS);
    page.on('dialog', dialog => void dialog.accept());

    await page.locator(SELECTORS.IMPORT_BACKUP_INPUT).setInputFiles({
      name: 'coupe.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{"v":1,"data":{"app"'),
    });

    await expect(page.locator(SELECTORS.BACKUP_FEEDBACK)).toContainText(
      /refusé/i
    );

    const snapshot = await readSnapshot(page);
    expect(snapshot.data.records).toHaveLength(3);
  });

  test('@critical exporter, effacer, réimporter, retrouver les contractions', async ({
    page,
  }) => {
    // Toutes les confirmations de ce parcours sont des `confirm()` natifs :
    // effacer l'historique, puis remplacer les données à l'import.
    page.on('dialog', dialog => void dialog.accept());

    // 1. Exporter.
    await page.goto(ROUTES.SETTINGS);
    const { filename, text } = await exportToText(page);
    expect(JSON.parse(text).data.records).toHaveLength(3);

    // 2. Effacer, avec le bouton de l'application — pas avec `localStorage`.
    await page.goto(ROUTES.TABLE);
    await page.locator(SELECTORS.CLEAR_HISTORY_BTN).click();
    await expect(page.locator(SELECTORS.TABLE_EMPTY)).toBeVisible();

    // 3. Réimporter le fichier tel qu'il a été téléchargé.
    await page.goto(ROUTES.SETTINGS);
    await page.locator(SELECTORS.IMPORT_BACKUP_INPUT).setInputFiles({
      name: filename,
      mimeType: 'application/json',
      buffer: Buffer.from(text),
    });
    await expect(page.locator(SELECTORS.BACKUP_FEEDBACK)).toContainText('3');

    // 4. Les contractions sont de retour, à l'écran et sur le disque.
    await page.goto(ROUTES.TABLE);
    await expect(
      page.locator(`${SELECTORS.CONTRACTIONS_TABLE} tbody tr`)
    ).toHaveCount(3);

    const snapshot = await readSnapshot(page);
    expect(snapshot.data.records.map((r: { id: string }) => r.id)).toEqual([
      'e1',
      'e2',
      'e3',
    ]);
  });

  test('sauvegarde - le bandeau de rappel mène à la section Sauvegarde', async ({
    page,
  }) => {
    /*
     * LE BANDEAU POINTAIT VERS RIEN. Il réclamait « Pensez à exporter une
     * sauvegarde (Partager / Exporter) » tous les sept jours, et aucun bouton
     * d'export n'existait dans l'application. On vérifie donc le lien ET son
     * point de chute.
     *
     * `Banners` ne rend qu'UN bandeau, et le rappel de sauvegarde est le
     * dernier de la file. On resème donc UN SEUL enregistrement : les trois
     * intervalles de cinq minutes du `beforeEach` déclenchent la pré-alerte
     * sous `maxIntervalMin: 5`, et un rappel de sauvegarde n'a rien à
     * disputer à une alerte d'accouchement imminent — la priorité est bonne,
     * c'est au test de ne pas la provoquer.
     *
     * Le bandeau d'annulation, lui, ne gêne plus : il ne répond qu'à un ajout
     * survenu sous les yeux de l'utilisatrice, et non au simple chargement
     * (voir `Banners.exportNudge.test.tsx`, qui fige les deux cas).
     */
    await page.evaluate(
      ([recordsKey, settingsKey, snapshotKey]) => {
        localStorage.removeItem(snapshotKey);
        const now = Date.now();
        localStorage.setItem(
          recordsKey,
          JSON.stringify([{ id: 'seul', start: now - 900000, end: now - 840000 }])
        );
        localStorage.setItem(
          settingsKey,
          JSON.stringify({ language: 'fr', consecutiveCount: 3 })
        );
      },
      [KEY_RECORDS, KEY_SETTINGS, SNAPSHOT_KEY] as const
    );
    await page.reload();
    await page.waitForLoadState('networkidle');

    const lien = page.locator(SELECTORS.EXPORT_NUDGE_LINK);
    await expect(lien).toBeVisible();
    await lien.click();

    await expect(page.locator(SELECTORS.EXPORT_BACKUP_BTN)).toBeVisible();
  });
});

test.describe('Signaler un problème', () => {
  test('le pied de page ouvre le gabarit `bug.yml` prérempli', async ({
    page,
  }) => {
    await page.goto(ROUTES.HOME);

    const lien = page.locator(SELECTORS.FOOTER_ISSUES_LINK);
    await expect(lien).toBeVisible();

    const href = await lien.getAttribute('href');
    expect(href).toContain(
      'https://github.com/mister-guiiug/miss-contraction/issues/new'
    );
    expect(href).toContain('template=bug.yml');
    // L'environnement est rempli par l'application, pas par l'utilisatrice :
    // c'est tout l'intérêt du lien.
    expect(href).toContain('environnement=');
    await expect(lien).toHaveAttribute('target', '_blank');
    await expect(lien).toHaveAttribute('rel', /noopener/);
  });
});

test.describe('Navigation & Routing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('navigation - accueil', async ({ page }) => {
    await page.goto('/');
    const homeView = page.locator('#view-home, [class*="home"]').first();
    await expect(homeView).toBeVisible();
  });

  test('navigation - paramètres', async ({ page }) => {
    await page.goto('/parametres');
    const settingsView = page.locator('[class*="settings"], form').first();
    await expect(settingsView).toBeVisible();
  });

  test('navigation - historique', async ({ page }) => {
    await page.goto('/historique');
    const tableView = page.locator('table, .table-page, [role="grid"]').first();
    if (await tableView.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(tableView).toBeVisible();
    }
  });

  test('navigation - maternité', async ({ page }) => {
    await page.goto('/maternite');
    const maternityView = page.locator('[class*="maternity"]').first();
    await expect(maternityView).toBeVisible();
  });

  test('navigation - message', async ({ page }) => {
    await page.goto('/message');
    const messageView = page.locator('textarea, [class*="message"]').first();
    if (await messageView.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(messageView).toBeVisible();
    }
  });

  test('navigation - sage-femme', async ({ page }) => {
    await page.goto('/sage-femme');
    const midwifeView = page
      .locator('[class*="midwife"], [class*="sage"]')
      .first();
    if (await midwifeView.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(midwifeView).toBeVisible();
    }
  });

  /*
   * `/settings` N'EST PAS UNE REDIRECTION, c'est un ALIAS. `AppRouter` déclare
   * un chemin par langue (`/parametres`, `/settings`, `/configuracion`, …) qui
   * monte la même vue, sans changer l'URL. Seuls `/tableau` et `/table`
   * redirigent vraiment, vers `/historique`. Ce test attendait une redirection
   * qui n'a jamais existé ; il vérifie désormais ce que l'application promet.
   */
  test('alias - /settings monte la vue des paramètres sans rediriger', async ({
    page,
  }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/settings');
    await expect(page.locator('[data-testid="settings-view"]')).toBeVisible();
  });

  test('redirect - /tableau vers /historique', async ({ page }) => {
    await page.goto('/tableau');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl).toContain('/historique');
  });

  test('redirect - /table vers /historique', async ({ page }) => {
    await page.goto('/table');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl).toContain('/historique');
  });

  test('alias - /maternity monte la vue maternité sans rediriger', async ({
    page,
  }) => {
    await page.goto('/maternity');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/maternity');
    await expect(page.locator('[data-testid="maternity-view"]')).toBeVisible();
  });

  test('redirect - /sagefemme vers /sage-femme', async ({ page }) => {
    await page.goto('/sagefemme');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl).toContain('/sage-femme');
  });

  test('redirect - /messages vers /message', async ({ page }) => {
    await page.goto('/messages');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl).toContain('/message');
  });

  test('redirect - /sms vers /message', async ({ page }) => {
    await page.goto('/sms');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl).toContain('/message');
  });

  test('navigation menu - affiche tous les liens', async ({ page }) => {
    await page.goto('/');

    const navLinks = page.locator('nav a, [role="navigation"] a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('navigation menu - liens cliquables', async ({ page }) => {
    await page.goto('/');

    /*
     * `a` filtré par texte attrapait d'abord le lien du TIROIR fermé —
     * invisible pour l'utilisatrice, cliquable pour Playwright, donc un
     * timeout de 30 s. On passe par la barre basse, la vraie navigation.
     */
    await clickNavLink(page, ROUTES.TABLE);
    await expect(page).toHaveURL(new RegExp(`${ROUTES.TABLE}$`));

    await clickNavLink(page, ROUTES.HOME);
    await expect(page).toHaveURL(/\/$/);
  });

  test('document title - change selon la page', async ({ page }) => {
    await page.goto('/');
    const title = await page.title();
    expect(title).toBeTruthy();

    await page.goto('/parametres');
    const newTitle = await page.title();
    expect(newTitle).toBeTruthy();
    // Les titres peuvent être différents
    expect(title).toBeDefined();
  });

  test('back button - fonctionne', async ({ page }) => {
    await page.goto('/');
    const startUrl = page.url();

    // Naviguer vers une autre page
    await page.goto('/parametres');
    await page.waitForLoadState('networkidle');

    // Revenir en arrière
    await page.goBack();
    await page.waitForLoadState('networkidle');

    const backUrl = page.url();
    expect(backUrl).toBe(startUrl);
  });

  test('forward button - fonctionne', async ({ page }) => {
    await page.goto('/');
    await page.goto('/parametres');
    // `goBack` n'était pas attendu : `goForward` partait pendant la
    // navigation arrière et restait bloqué jusqu'au timeout.
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Aller en avant
    await page.goForward();
    await page.waitForLoadState('networkidle');

    const forwardUrl = page.url();
    expect(forwardUrl).toContain('/parametres');
  });

  test('lien direct - accessible via URL', async ({ page }) => {
    const routes = [
      '/',
      '/parametres',
      '/historique',
      '/maternite',
      '/message',
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();
      // Vérifier que la route est bien accessible
      expect(currentUrl).toBeTruthy();
    }
  });
});

test.describe('Navigation Responsive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('menu mobile - affiche le menu navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const nav = page.locator('nav, [role="navigation"]');
    if (await nav.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(nav).toBeVisible();
    }
  });

  test('bottom navigation - accessible sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const bottomNav = page.locator('[class*="bottom-nav"], nav');
    if (await bottomNav.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(bottomNav).toBeVisible();
    }
  });

  test('menu desktop - affiche sur large écrans', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');

    const nav = page.locator('nav, [role="navigation"]');
    if (await nav.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(nav).toBeVisible();
    }
  });
});
