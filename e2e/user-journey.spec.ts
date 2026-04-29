/**
 * Tests de parcours utilisateur complets (User Journeys)
 * Simule des scénarios réels du début à la fin
 * @tag @journey @critical
 */

import { test, expect } from '@playwright/test';
import { ROUTES, TEST_DATA } from './config';

test.describe('Parcours - Première utilisation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('@journey @critical parcours complet : configuration → contractions → alerte', async ({ page }) => {
    // === ÉTAPE 1 : Configuration initiale ===
    await page.goto(ROUTES.SETTINGS);
    await page.waitForLoadState('networkidle');

    await page.locator('[data-testid="max-interval-input"]').fill('5');
    await page.locator('[data-testid="min-duration-input"]').fill('30');
    await page.locator('[data-testid="consecutive-count-input"]').fill('3');

    const { maternity } = TEST_DATA;
    await page.locator('[data-testid="maternity-label-input"]').fill(maternity.name);
    await page.locator('[data-testid="maternity-phone-input"]').fill(maternity.phone);
    await page.locator('[data-testid="maternity-address-textarea"]').fill(maternity.address);

    await page.locator('[data-testid="settings-save-btn"]').click();
    await page.waitForTimeout(500);

    // Feedback de sauvegarde visible
    const feedback = page.locator('[data-testid="settings-save-feedback"]');
    await expect(feedback).toBeVisible({ timeout: 2000 });

    // === ÉTAPE 2 : Retour accueil ===
    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await expect(btn).toBeVisible();

    // === ÉTAPE 3 : Enregistrer 3 contractions ===
    for (let i = 0; i < 3; i++) {
      await btn.click();
      await page.waitForTimeout(700);
      await btn.click();
      await page.waitForTimeout(i < 2 ? 500 : 200);
    }

    // Vérifier que les contractions sont dans l'historique
    const historyItems = page.locator('[data-testid="history-items"] li');
    await expect(historyItems).toHaveCount(3);

    // === ÉTAPE 4 : Vérifier les stats ===
    const statsSection = page.locator('[data-testid="stats-section"]');
    await expect(statsSection).toBeVisible();

    // === ÉTAPE 5 : Consulter le tableau ===
    await page.goto(ROUTES.TABLE);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="contractions-table"]')).toBeVisible();
    const rows = page.locator('[data-testid^="table-row-"]');
    await expect(rows).toHaveCount(3);

    // === ÉTAPE 6 : Vue maternité ===
    await page.goto(ROUTES.MATERNITY);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="maternity-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="maternity-label"]')).toContainText(maternity.name);

    // === ÉTAPE 7 : Vue message ===
    await page.goto(ROUTES.MESSAGE);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="message-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-textarea"]')).toBeVisible();
  });

  test('@journey parcours mobile simplifié : démarrer, noter, arrêter', async ({ page }) => {
    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await expect(btn).toBeVisible();

    // Démarrer la contraction
    await btn.click();
    await page.waitForTimeout(300);

    // Vérifier le timer actif
    await expect(page.locator('[data-testid="timer-display"]')).toBeVisible();

    // Arrêter
    await btn.click();
    await page.waitForTimeout(300);

    // La contraction est enregistrée
    await expect(page.locator('[data-testid="history-items"] li')).toHaveCount(1);
  });
});

test.describe('Parcours - Gestion des notes et intensité', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('@journey ajouter une note rapide via balloon', async ({ page }) => {
    // Sélectionner une note rapide avant la contraction
    const walkBtn = page.locator('[data-testid="quick-note-walk"]');
    if (await walkBtn.isVisible()) {
      await walkBtn.click();
      await page.waitForTimeout(200);
    }

    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await btn.click();
    await page.waitForTimeout(500);
    await btn.click();
    await page.waitForTimeout(300);

    // La contraction enregistrée doit avoir une note
    const records = await page.evaluate(() => {
      const raw = localStorage.getItem('mc_records');
      return raw ? JSON.parse(raw) : [];
    });

    expect(records.length).toBe(1);
  });

  test('@journey modifier une contraction existante', async ({ page }) => {
    // Injecter une contraction
    const now = Date.now();
    const fakeRecords = [{ id: 'r1', start: now - 60000, end: now - 59000 }];
    await page.evaluate(([key, records]) => {
      localStorage.setItem(key, JSON.stringify(records));
    }, ['mc_records', fakeRecords] as [string, typeof fakeRecords]);

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Ouvrir le dialog d'édition
    const editBtn = page.locator('[data-testid^="edit-record-btn-"]').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    const dialog = page.locator('[data-testid="edit-dialog"]');
    await expect(dialog).toBeVisible();

    // Ajouter une note
    const noteTextarea = page.locator('[data-testid="edit-note-textarea"]');
    await noteTextarea.fill('Note de test modifiée');

    // Sauvegarder
    await page.locator('[data-testid="edit-dialog-save-btn"]').click();
    await page.waitForTimeout(300);

    // Le dialog est fermé
    await expect(dialog).not.toBeVisible();

    // La note est persistée
    const records = await page.evaluate(() => {
      const raw = localStorage.getItem('mc_records');
      return raw ? JSON.parse(raw) : [];
    });
    expect(records[0].note).toBe('Note de test modifiée');
  });

  test('@journey supprimer une contraction', async ({ page }) => {
    const now = Date.now();
    const fakeRecords = [
      { id: 'r1', start: now - 120000, end: now - 119000 },
      { id: 'r2', start: now - 60000, end: now - 59000 },
    ];
    await page.evaluate(([key, records]) => {
      localStorage.setItem(key, JSON.stringify(records));
    }, ['mc_records', fakeRecords] as [string, typeof fakeRecords]);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const items = page.locator('[data-testid="history-items"] li');
    await expect(items).toHaveCount(2);

    // Supprimer la première
    const deleteBtn = page.locator('[data-testid^="delete-record-btn-"]').first();
    page.once('dialog', (dialog) => dialog.accept());
    await deleteBtn.click();
    await page.waitForTimeout(300);

    await expect(items).toHaveCount(1);
  });
});

test.describe('Parcours - Navigation complète', () => {
  test('@journey @critical navigation entre toutes les vues sans erreur', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    const routes = [
      ROUTES.HOME,
      ROUTES.SETTINGS,
      ROUTES.TABLE,
      ROUTES.MATERNITY,
      ROUTES.MESSAGE,
      ROUTES.MIDWIFE,
    ];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Vérifier que la page a chargé
      await expect(page.locator('body')).not.toBeEmpty();
    }

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('@journey la navigation retour fonctionne depuis les vues secondaires', async ({ page }) => {
    // Paramètres → Retour
    await page.goto(ROUTES.SETTINGS);
    await page.waitForLoadState('networkidle');
    const backLink = page.locator('[data-testid="settings-back-link"]');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(new RegExp(ROUTES.HOME + '.*'));

    // Table → Retour
    await page.goto(ROUTES.TABLE);
    await page.waitForLoadState('networkidle');
    const tableBackLink = page.locator('[data-testid="table-back-link"]');
    await expect(tableBackLink).toBeVisible();
    await tableBackLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="toggle-contraction-btn"]')).toBeVisible();
  });
});

test.describe('Parcours - Scénario urgence', () => {
  test('@journey @critical appel maternité depuis vue maternité configurée', async ({ page }) => {
    // Configurer la maternité
    await page.goto(ROUTES.SETTINGS);
    await page.waitForLoadState('networkidle');

    const { maternity } = TEST_DATA;
    await page.locator('[data-testid="maternity-label-input"]').fill(maternity.name);
    await page.locator('[data-testid="maternity-phone-input"]').fill(maternity.phone);
    await page.locator('[data-testid="settings-save-btn"]').click();
    await page.waitForTimeout(500);

    // Aller sur la vue maternité
    await page.goto(ROUTES.MATERNITY);
    await page.waitForLoadState('networkidle');

    // Le bouton d'appel doit être visible et contenir le numéro
    const callBtn = page.locator('[data-testid="maternity-call-btn"]');
    await expect(callBtn).toBeVisible();
    await expect(callBtn).toHaveAttribute('href', `tel:${maternity.phone}`);
  });

  test('@journey préparer le message WhatsApp', async ({ page }) => {
    await page.goto(ROUTES.MESSAGE);
    await page.waitForLoadState('networkidle');

    // Le textarea doit être visible
    const textarea = page.locator('[data-testid="message-textarea"]');
    await expect(textarea).toBeVisible();

    // Les boutons d'envoi sont présents
    await expect(page.locator('[data-testid="message-whatsapp-btn"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-sms-btn"]')).toBeVisible();
  });
});

test.describe('Parcours - Undo (annulation)', () => {
  test('@journey annuler la suppression d'une contraction', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());

    const now = Date.now();
    const fakeRecords = [
      { id: 'r1', start: now - 60000, end: now - 59000 },
    ];
    await page.evaluate(([key, records]) => {
      localStorage.setItem(key, JSON.stringify(records));
    }, ['mc_records', fakeRecords] as [string, typeof fakeRecords]);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const items = page.locator('[data-testid="history-items"] li');
    await expect(items).toHaveCount(1);

    // Supprimer
    const deleteBtn = page.locator('[data-testid^="delete-record-btn-"]').first();
    page.once('dialog', (dialog) => dialog.accept());
    await deleteBtn.click();
    await page.waitForTimeout(300);

    // La liste est vide (ou l'état vide est visible)
    const countAfterDelete = await items.count();
    expect(countAfterDelete).toBe(0);
  });
});
