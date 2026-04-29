/**
 * Tests de gestion d'erreurs et edge cases
 * Vérifie la robustesse de l'app face aux conditions difficiles
 * @tag @errors @resilience
 */

import { test, expect } from '@playwright/test';
import { ROUTES } from './config';

test.describe('Gestion d'erreurs - API manquantes', () => {
  test('@errors l'app fonctionne sans API Notification', async ({ page }) => {
    // Supprimer l'API Notification
    await page.addInitScript(() => {
      delete (window as any).Notification;
    });

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await expect(btn).toBeVisible();

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('@errors l'app fonctionne sans API Vibration', async ({ page }) => {
    await page.addInitScript(() => {
      delete (navigator as any).vibrate;
    });

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await expect(btn).toBeVisible();
    await btn.click();
    await page.waitForTimeout(300);
    await btn.click();

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('@errors l'app fonctionne sans WakeLock API', async ({ page }) => {
    await page.addInitScript(() => {
      delete (navigator as any).wakeLock;
    });

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await btn.click();
    await page.waitForTimeout(300);
    await btn.click();

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('@errors l'app fonctionne sans Clipboard API', async ({ page }) => {
    await page.addInitScript(() => {
      delete (navigator as any).clipboard;
    });

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(ROUTES.MESSAGE);
    await page.waitForLoadState('networkidle');

    // Tenter de copier
    const copyBtn = page.locator('[data-testid="message-copy-btn"]');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await page.waitForTimeout(300);

    // Le feedback d'erreur doit s'afficher proprement (pas de crash)
    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Gestion d'erreurs - localStorage indisponible', () => {
  test('@errors l'app se charge si localStorage lance une exception', async ({ page }) => {
    await page.addInitScript(() => {
      // Simuler localStorage qui rejette les opérations
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => null,
          setItem: () => { throw new DOMException('QuotaExceededError'); },
          removeItem: () => {},
          clear: () => {},
          length: 0,
          key: () => null,
        },
        writable: false,
        configurable: true,
      });
    });

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    // L'app doit charger même si écriture localStorage échoue
    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await expect(btn).toBeVisible();
  });
});

test.describe('Gestion d'erreurs - Routes invalides', () => {
  test('@errors une route inconnue redirige ou affiche un état correct', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/route-qui-nexiste-pas');
    await page.waitForLoadState('domcontentloaded');

    // La page doit rester opérationnable (pas de crash blank page)
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('@errors naviguer vers /parametres fonctionne', async ({ page }) => {
    await page.goto(ROUTES.SETTINGS);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="settings-view"]')).toBeVisible();
  });
});

test.describe('Gestion d'erreurs - Valeurs limites dans les formulaires', () => {
  test('@errors maxIntervalMin : valeur minimum (1)', async ({ page }) => {
    await page.goto(ROUTES.SETTINGS);
    await page.waitForLoadState('networkidle');

    const input = page.locator('[data-testid="max-interval-input"]');
    await input.fill('1');
    await page.locator('[data-testid="settings-save-btn"]').click();
    await page.waitForTimeout(300);

    // Pas d'erreur, valeur acceptée
    await expect(input).toHaveValue('1');
  });

  test('@errors maxIntervalMin : valeur maximum (30)', async ({ page }) => {
    await page.goto(ROUTES.SETTINGS);
    await page.waitForLoadState('networkidle');

    const input = page.locator('[data-testid="max-interval-input"]');
    await input.fill('30');
    await page.locator('[data-testid="settings-save-btn"]').click();
    await page.waitForTimeout(300);

    await expect(input).toHaveValue('30');
  });

  test('@errors minDurationSec : valeur minimum (10)', async ({ page }) => {
    await page.goto(ROUTES.SETTINGS);
    await page.waitForLoadState('networkidle');

    const input = page.locator('[data-testid="min-duration-input"]');
    await input.fill('10');
    await page.locator('[data-testid="settings-save-btn"]').click();
    await page.waitForTimeout(300);

    await expect(input).toHaveValue('10');
  });

  test('@errors note de contraction : texte vide ne plante pas', async ({ page }) => {
    const now = Date.now();
    const fakeRecords = [
      { id: 'r1', start: now - 60000, end: now - 59000, note: '' },
    ];
    await page.addInitScript(([key, records]) => {
      localStorage.setItem(key, JSON.stringify(records));
    }, ['mc_records', fakeRecords] as [string, typeof fakeRecords]);

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);
  });

  test('@errors note de contraction : texte très long (240 chars)', async ({ page }) => {
    const now = Date.now();
    const longNote = 'A'.repeat(240);
    const fakeRecords = [
      { id: 'r1', start: now - 60000, end: now - 59000, note: longNote },
    ];
    await page.addInitScript(([key, records]) => {
      localStorage.setItem(key, JSON.stringify(records));
    }, ['mc_records', fakeRecords] as [string, typeof fakeRecords]);

    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    const criticalErrors = errors.filter((e) => !e.includes('ResizeObserver'));
    expect(criticalErrors).toHaveLength(0);

    // L'historique doit toujours s'afficher
    await expect(page.locator('[data-testid="history-items"]')).toBeVisible();
  });
});

test.describe('Gestion d'erreurs - Double-clic et race conditions', () => {
  test('@errors double-clic rapide sur le bouton timer ne crée pas deux entrées', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await expect(btn).toBeVisible();

    // Double-clic rapide
    await btn.dblclick();
    await page.waitForTimeout(500);

    // Vérifier l'état cohérent (pas de contraction "fantôme" non fermée)
    const records = await page.evaluate(() => {
      const raw = localStorage.getItem('mc_records');
      return raw ? JSON.parse(raw) : [];
    });

    // Les records mal formés (end <= start) doivent être filtrés
    const validRecords = (records as any[]).filter((r: any) => r.end > r.start);
    // Au plus 1 contraction validée après double-clic
    expect(validRecords.length).toBeLessThanOrEqual(1);
  });

  test('@errors clic start puis reload n'enregistre pas de contraction incomplète', async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    const btn = page.locator('[data-testid="toggle-contraction-btn"]');
    await btn.click(); // Démarrer sans arrêter
    await page.waitForTimeout(300);

    // Recharger sans avoir cliqué "Fin"
    await page.reload();
    await page.waitForLoadState('networkidle');

    // L'historique ne doit pas avoir d'entrée invalide
    const historyItems = page.locator('[data-testid="history-items"] li');
    const count = await historyItems.count().catch(() => 0);
    // 0 car la contraction ouverte n'est pas encore enregistrée
    expect(count).toBe(0);
  });
});

test.describe('Gestion d'erreurs - Édition de contractions', () => {
  test('@errors éditer une contraction avec end avant start affiche une erreur', async ({ page }) => {
    const now = Date.now();
    const fakeRecords = [
      { id: 'r1', start: now - 60000, end: now - 59000 },
    ];
    await page.addInitScript(([key, records]) => {
      localStorage.setItem(key, JSON.stringify(records));
    }, ['mc_records', fakeRecords] as [string, typeof fakeRecords]);

    await page.goto(ROUTES.HOME);
    await page.waitForLoadState('networkidle');

    // Ouvrir le dialog d'édition
    const editBtn = page.locator(`[data-testid^="edit-record-btn-"]`).first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    const dialog = page.locator('[data-testid="edit-dialog"]');
    await expect(dialog).toBeVisible();

    // Saisir une date de fin antérieure au début
    const endInput = page.locator('[data-testid="edit-end-input"]');
    const startInput = page.locator('[data-testid="edit-start-input"]');

    // Mettre end = start - 1 heure (invalide)
    const startVal = await startInput.inputValue();
    const startDate = new Date(startVal);
    startDate.setHours(startDate.getHours() - 1);
    const invalidEndVal = startDate.toISOString().slice(0, 19);

    await endInput.fill(invalidEndVal);
    await page.locator('[data-testid="edit-dialog-save-btn"]').click();

    // Une erreur doit s'afficher
    const errorMsg = page.locator('[data-testid="edit-dialog-error"]');
    await expect(errorMsg).toBeVisible();
  });
});
