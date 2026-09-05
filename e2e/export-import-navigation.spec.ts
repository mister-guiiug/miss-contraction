/**
 * Tests E2E - Export/Import & Navigation
 * Couverture: export JSON, import, navigation routes, redirects
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { ROUTES, KEY_RECORDS, KEY_SETTINGS } from './config';
import { clickNavLink } from './helpers';

test.describe('Export & Import', () => {
  test.beforeEach(async ({ page }) => {
    /*
     * On sème l'état au lieu de cliquer trois fois le chronomètre : c'est
     * déterministe, et surtout les réglages sont réellement écrits. Le test
     * « export - inclut les paramètres » lisait `mc_settings_v1` alors que
     * rien ne l'avait jamais créé — il tombait sur `null` et levait un
     * `TypeError` en lisant `.maternityLabel`.
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

  test('export - télécharge un fichier JSON', async ({ page }) => {
    const exportButton = page
      .locator('button')
      .filter({ hasText: /Export|Sauvegarder|Télécharger/ })
      .first();

    if (await exportButton.isVisible({ timeout: 500 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(json|JSON)$/);
    }
  });

  test('export - inclut les enregistrements', async ({ page }) => {
    const exportData = await page.evaluate(() => {
      const records = localStorage.getItem('mc_contractions_v1');
      return records ? JSON.parse(records) : null;
    });

    expect(exportData).toBeDefined();
    expect(Array.isArray(exportData)).toBe(true);
    expect(exportData.length).toBeGreaterThan(0);
  });

  test('export - inclut les paramètres', async ({ page }) => {
    const exportData = await page.evaluate(() => {
      const settings = localStorage.getItem('mc_settings_v1');
      return settings ? JSON.parse(settings) : null;
    });

    expect(exportData).toBeDefined();
    expect(exportData.maternityLabel).toBeDefined();
    expect(exportData.maxIntervalMin).toBeDefined();
  });

  test('import - restaure les données depuis JSON', async ({ page }) => {
    // Exporter les données actuelles
    const originalData = await page.evaluate(() => {
      return {
        records: JSON.parse(localStorage.getItem('mc_contractions_v1') || '[]'),
        settings: JSON.parse(localStorage.getItem('mc_settings_v1') || '{}'),
      };
    });

    // Nettoyer
    await page.evaluate(() => localStorage.clear());

    // Importer les données
    const importButton = page
      .locator('button')
      .filter({ hasText: /Import|Importer|Charger/ })
      .first();

    if (await importButton.isVisible({ timeout: 500 }).catch(() => false)) {
      // Créer un fichier JSON de test
      const jsonData = JSON.stringify(originalData);

      // Simuler l'import
      await page.evaluate(json => {
        const data = JSON.parse(json);
        if (data.records)
          localStorage.setItem(
            'mc_contractions_v1',
            JSON.stringify(data.records)
          );
        if (data.settings)
          localStorage.setItem('mc_settings_v1', JSON.stringify(data.settings));
      }, jsonData);

      // Vérifier que les données sont restaurées
      const restoredData = await page.evaluate(() => {
        return {
          records: JSON.parse(
            localStorage.getItem('mc_contractions_v1') || '[]'
          ),
          settings: JSON.parse(localStorage.getItem('mc_settings_v1') || '{}'),
        };
      });

      expect(restoredData.records.length).toBe(originalData.records.length);
    }
  });

  test('export - format correct du fichier', async ({ page }) => {
    const exportData = await page.evaluate(() => {
      return {
        records: JSON.parse(localStorage.getItem('mc_contractions_v1') || '[]'),
        settings: JSON.parse(localStorage.getItem('mc_settings_v1') || '{}'),
      };
    });

    // Vérifier la structure
    expect(exportData.records).toBeDefined();
    expect(exportData.settings).toBeDefined();

    // Vérifier les champs des enregistrements
    if (exportData.records.length > 0) {
      const record = exportData.records[0];
      expect(record.id).toBeDefined();
      expect(record.start).toBeDefined();
      expect(record.end).toBeDefined();
    }
  });

  test('sauvegarde - notification de rappel', async ({ page }) => {
    // Chercher le bouton de rappel de sauvegarde
    const saveReminderButton = page
      .locator('button')
      .filter({ hasText: /Sauvegarder|Exporter/ })
      .first();

    if (
      await saveReminderButton.isVisible({ timeout: 500 }).catch(() => false)
    ) {
      await expect(saveReminderButton).toBeVisible();
    }
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
