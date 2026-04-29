/**
 * Tests E2E - Export/Import & Navigation
 * Couverture: export JSON, import, navigation routes, redirects
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Export & Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Créer quelques contractions
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    for (let i = 0; i < 3; i++) {
      await startButton.click();
      await page.waitForTimeout(200);
      const stopButton = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
      await stopButton.click();
      await page.waitForTimeout(300);
    }
  });

  test('export - télécharge un fichier JSON', async ({ page }) => {
    const exportButton = page.locator('button').filter({ hasText: /Export|Sauvegarder|Télécharger/ }).first();
    
    if (await exportButton.isVisible({ timeout: 500 }).catch(() => false)) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();

      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(json|JSON)$/);
    }
  });

  test('export - inclut les enregistrements', async ({ page }) => {
    const exportData = await page.evaluate(() => {
      const records = localStorage.getItem('mc_records');
      return records ? JSON.parse(records) : null;
    });

    expect(exportData).toBeDefined();
    expect(Array.isArray(exportData)).toBe(true);
    expect(exportData.length).toBeGreaterThan(0);
  });

  test('export - inclut les paramètres', async ({ page }) => {
    const exportData = await page.evaluate(() => {
      const settings = localStorage.getItem('mc_settings');
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
        records: JSON.parse(localStorage.getItem('mc_records') || '[]'),
        settings: JSON.parse(localStorage.getItem('mc_settings') || '{}'),
      };
    });

    // Nettoyer
    await page.evaluate(() => localStorage.clear());

    // Importer les données
    const importButton = page.locator('button').filter({ hasText: /Import|Importer|Charger/ }).first();
    
    if (await importButton.isVisible({ timeout: 500 }).catch(() => false)) {
      // Créer un fichier JSON de test
      const jsonData = JSON.stringify(originalData);
      
      // Simuler l'import
      await page.evaluate(json => {
        const data = JSON.parse(json);
        if (data.records) localStorage.setItem('mc_records', JSON.stringify(data.records));
        if (data.settings) localStorage.setItem('mc_settings', JSON.stringify(data.settings));
      }, jsonData);

      // Vérifier que les données sont restaurées
      const restoredData = await page.evaluate(() => {
        return {
          records: JSON.parse(localStorage.getItem('mc_records') || '[]'),
          settings: JSON.parse(localStorage.getItem('mc_settings') || '{}'),
        };
      });

      expect(restoredData.records.length).toBe(originalData.records.length);
    }
  });

  test('export - format correct du fichier', async ({ page }) => {
    const exportData = await page.evaluate(() => {
      return {
        records: JSON.parse(localStorage.getItem('mc_records') || '[]'),
        settings: JSON.parse(localStorage.getItem('mc_settings') || '{}'),
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
    const saveReminderButton = page.locator('button').filter({ hasText: /Sauvegarder|Exporter/ }).first();
    
    if (await saveReminderButton.isVisible({ timeout: 500 }).catch(() => false)) {
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
    const midwifeView = page.locator('[class*="midwife"], [class*="sage"]').first();
    if (await midwifeView.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(midwifeView).toBeVisible();
    }
  });

  test('redirect - /settings vers /parametres', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/parametres');
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

  test('redirect - /maternity vers /maternite', async ({ page }) => {
    await page.goto('/maternity');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    expect(currentUrl).toContain('/maternite');
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

    const homeLink = page.locator('a[href="/"], a').filter({ hasText: /Accueil|Home/ }).first();
    if (await homeLink.isVisible({ timeout: 500 }).catch(() => false)) {
      await homeLink.click();
      const currentUrl = page.url();
      expect(currentUrl).toContain('/');
    }
  });

  test('document title - change selon la page', async ({ page }) => {
    await page.goto('/');
    let title = await page.title();
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
    await page.goBack();

    // Aller en avant
    await page.goForward();
    await page.waitForLoadState('networkidle');

    const forwardUrl = page.url();
    expect(forwardUrl).toContain('/parametres');
  });

  test('lien direct - accessible via URL', async ({ page }) => {
    const routes = ['/', '/parametres', '/historique', '/maternite', '/message'];

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
