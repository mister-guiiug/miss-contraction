/**
 * Tests d'intégration localStorage
 * Vérifie la persistance des données après rechargement, modification et corruption
 * @tag @storage @critical
 */

import { test, expect } from '@playwright/test';
import { ROUTES, TEST_DATA } from './config';

const RECORDS_KEY = 'mc_records';
const SETTINGS_KEY = 'mc_settings';

test.describe('LocalStorage - Persistance des contractions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('@storage @critical les contractions persistent après rechargement', async ({ page }) => {
    // Créer une contraction via l'interface
    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await expect(btn).toBeVisible();
    await btn.click();
    await page.waitForTimeout(600);
    await btn.click();
    await page.waitForTimeout(300);

    // Vérifier que localStorage contient les données
    const records = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, RECORDS_KEY);

    expect(records).not.toBeNull();
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBeGreaterThanOrEqual(1);
    expect(records[0]).toMatchObject({
      id: expect.any(String),
      start: expect.any(Number),
      end: expect.any(Number),
    });

    // Recharger la page et vérifier que les données sont toujours là
    await page.reload();
    await page.waitForLoadState('networkidle');

    const afterReload = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, RECORDS_KEY);

    expect(afterReload).toHaveLength(records.length);
    expect(afterReload[0].id).toBe(records[0].id);
  });

  test('@storage les contractions s'affichent bien dans l'historique après rechargement', async ({ page }) => {
    // Injecter 3 contractions directement dans localStorage
    const now = Date.now();
    const fakeRecords = [
      { id: 'r1', start: now - 600000, end: now - 599000 },
      { id: 'r2', start: now - 300000, end: now - 298500 },
      { id: 'r3', start: now - 120000, end: now - 118000 },
    ];

    await page.evaluate(([key, records]) => {
      localStorage.setItem(key, JSON.stringify(records));
    }, [RECORDS_KEY, fakeRecords] as [string, typeof fakeRecords]);

    await page.reload();
    await page.waitForLoadState('networkidle');

    // L'historique doit afficher 3 entrées
    const items = page.locator('[data-testid="history-items"] li');
    await expect(items).toHaveCount(3);
  });

  test('@storage les paramètres persistent après rechargement', async ({ page }) => {
    await page.goto(ROUTES.SETTINGS);
    await page.waitForLoadState('networkidle');

    // Modifier le max interval
    const intervalInput = page.locator('[data-testid="max-interval-input"]');
    await intervalInput.fill('7');

    // Sauvegarder
    const saveBtn = page.locator('[data-testid="settings-save-btn"]');
    await saveBtn.click();
    await page.waitForTimeout(500);

    // Vérifier dans localStorage
    const savedSettings = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, SETTINGS_KEY);

    expect(savedSettings?.maxIntervalMin).toBe(7);

    // Recharger et vérifier
    await page.reload();
    await page.waitForLoadState('networkidle');

    const afterReloadInput = page.locator('[data-testid="max-interval-input"]');
    await expect(afterReloadInput).toHaveValue('7');
  });

  test('@storage effacer l'historique vide bien le localStorage', async ({ page }) => {
    // Injecter des contractions
    const fakeRecords = [
      { id: 'r1', start: Date.now() - 60000, end: Date.now() - 59000 },
    ];
    await page.evaluate(([key, records]) => {
      localStorage.setItem(key, JSON.stringify(records));
    }, [RECORDS_KEY, fakeRecords] as [string, typeof fakeRecords]);

    await page.reload();
    await page.waitForLoadState('networkidle');

    // Cliquer effacer l'historique
    const clearBtn = page.locator('[data-testid="clear-history-btn"]');
    await expect(clearBtn).toBeVisible();

    // Intercepter le dialog de confirmation
    page.once('dialog', (dialog) => dialog.accept());
    await clearBtn.click();
    await page.waitForTimeout(300);

    // Vérifier que localStorage est vide (ou tableau vide)
    const records = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, RECORDS_KEY);

    expect(records === null || (Array.isArray(records) && records.length === 0)).toBe(true);
  });
});

test.describe('LocalStorage - Données corrompues', () => {
  test('@storage l'app récupère sur données JSON corrompues', async ({ page }) => {
    // Injecter du JSON invalide dans localStorage
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'corrupted json{{{');
    }, RECORDS_KEY);

    // L'app doit charger sans planter
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    // Vérifier que la page s'est chargée correctement
    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await expect(btn).toBeVisible();

    // Aucune erreur JS critique
    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('@storage l'app récupère sur settings corrompues', async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.setItem(key, '{"invalid":true,"missing_fields":true}');
    }, SETTINGS_KEY);

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await expect(btn).toBeVisible();

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('@storage les contractions avec end <= start sont ignorées', async ({ page }) => {
    const now = Date.now();
    const badRecords = [
      { id: 'bad1', start: now - 1000, end: now - 2000 }, // end < start : invalide
      { id: 'good1', start: now - 3000, end: now - 2000 }, // valide
    ];

    await page.addInitScript(([key, records]) => {
      localStorage.setItem(key, JSON.stringify(records));
    }, [RECORDS_KEY, badRecords] as [string, typeof badRecords]);

    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    // L'historique doit afficher seulement la contraction valide
    const items = page.locator('[data-testid="history-items"] li');
    await expect(items).toHaveCount(1);
  });
});

test.describe('LocalStorage - Persistence des paramètres maternité', () => {
  test('@storage les infos maternité persistent', async ({ page }) => {
    await page.goto(ROUTES.SETTINGS);
    await page.waitForLoadState('networkidle');

    const { maternity } = TEST_DATA;

    await page.locator('[data-testid="maternity-label-input"]').fill(maternity.name);
    await page.locator('[data-testid="maternity-phone-input"]').fill(maternity.phone);
    await page.locator('[data-testid="maternity-address-textarea"]').fill(maternity.address);

    const saveBtn = page.locator('[data-testid="settings-save-btn"]');
    await saveBtn.click();
    await page.waitForTimeout(500);

    // Naviguer vers la vue maternité
    await page.goto(ROUTES.MATERNITY);
    await page.waitForLoadState('networkidle');

    // Vérifier les infos affichées
    await expect(page.locator('[data-testid="maternity-label"]')).toContainText(maternity.name);
    await expect(page.locator('[data-testid="maternity-phone"]')).toContainText(maternity.phone.replace(/\s/g, '').replace(/\s/g, ''));
  });

  test('@storage le message personnalisé persist', async ({ page }) => {
    await page.goto(ROUTES.MESSAGE);
    await page.waitForLoadState('networkidle');

    const textarea = page.locator('[data-testid="message-textarea"]');
    await expect(textarea).toBeVisible();
    await textarea.fill('Mon message personnalisé pour les tests');
    await page.waitForTimeout(800); // debounce autosave

    // Naviguer ailleurs et revenir
    await page.goto(ROUTES.HOME);
    await page.goto(ROUTES.MESSAGE);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('[data-testid="message-textarea"]')).toHaveValue(
      'Mon message personnalisé pour les tests'
    );
  });
});
