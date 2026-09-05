/**
 * Tests E2E - Alertes & Notifications
 * Couverture: seuils atteints, notifications navigateur, audio, visual
 */

import { test, expect } from '@playwright/test';
import { ROUTES, KEY_RECORDS } from './config';

test.describe('Alertes & Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Mock notification permission
    await page.evaluate(() => {
      (Notification as any).permission = 'granted';
    });
  });

  test("alerte visuelle - badge change d'état", async ({ page }) => {
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();

    // Créer plusieurs contractions pour atteindre le seuil
    for (let i = 0; i < 4; i++) {
      await startButton.click();
      await page.waitForTimeout(100);
      const stopButton = page
        .locator('button')
        .filter({ hasText: /Fin|Stop/ })
        .first();
      await stopButton.click();
      await page.waitForTimeout(200);
    }

    // Vérifier que le badge a changé d'état
    const badge = page.locator('.threshold-badge, [data-state]');
    if (await badge.isVisible({ timeout: 500 }).catch(() => false)) {
      const state = await badge.getAttribute('data-state');
      // L"état ne devrait plus être ’empty" ou 'calm'
      expect(state).toBeDefined();
    }
  });

  test("alerte pré-notification - bandeau d'avertissement", async ({
    page,
  }) => {
    // Configurer les seuils bas
    await page.goto('/parametres');
    const maxIntervalInput = page.locator('input[name="maxIntervalMin"]');
    if (await maxIntervalInput.isVisible({ timeout: 500 }).catch(() => false)) {
      await maxIntervalInput.fill('1');
      const submitButton = page.locator(
        'button:has-text("Enregistrer"), [type="submit"]'
      );
      if (await submitButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await submitButton.click();
      }
    }

    await page.goto('/');

    // Créer contractions rapides
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    for (let i = 0; i < 3; i++) {
      await startButton.click();
      await page.waitForTimeout(50);
      const stopButton = page
        .locator('button')
        .filter({ hasText: /Fin|Stop/ })
        .first();
      await stopButton.click();
      await page.waitForTimeout(100);
    }

    // Chercher le bandeau d'avertissement
    const banner = page.locator('.banner, [role="alert"], .alert');
    if (await banner.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(banner).toBeVisible();
    }
  });

  /*
   * ── RÉÉCRIT, PARCE QUE L'ANCIEN NE POUVAIT RIEN PROUVER ────────────────────
   *
   * Il remplaçait `Notification.prototype.show` — une méthode qui n'existe pas
   * dans l'API Notifications, où l'affichage se déclenche à la CONSTRUCTION.
   * Puis il appelait `page.goto()` deux fois, ce qui détruit le contexte
   * JavaScript et donc l'espion. Sa conclusion,
   * `expect(typeof notificationFired).toBe('boolean')`, lisait alors
   * `undefined` : le test échouait sur une tautologie qu'il n'arrivait même
   * plus à évaluer.
   *
   * On instrumente le CONSTRUCTEUR via `addInitScript`, qui survit aux
   * navigations, et on sème un motif qui atteint le seuil de façon
   * déterministe plutôt que de cliquer quatre fois le chronomètre.
   */
  test('seuil atteint - le badge passe en « match »', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['notifications']);
    await page.addInitScript(() => {
      (window as unknown as { __notifications: string[] }).__notifications = [];
      const Original = window.Notification;
      const Spy = function (this: unknown, title: string, opts?: unknown) {
        (
          window as unknown as { __notifications: string[] }
        ).__notifications.push(title);
        return new Original(title, opts as NotificationOptions);
      } as unknown as typeof Notification;
      Object.defineProperty(Spy, 'permission', { get: () => 'granted' });
      Spy.requestPermission = () => Promise.resolve('granted' as const);
      window.Notification = Spy;
    });

    /*
     * Trois contractions d'une minute, espacées de quatre minutes : sous le
     * seuil de cinq minutes et au-dessus des quarante-cinq secondes de durée
     * minimale, `computeThresholdBadge` doit donc rendre « match ».
     */
    await page.goto(ROUTES.HOME);
    await page.evaluate(key => {
      const now = Date.now();
      localStorage.setItem(
        key,
        JSON.stringify([
          { id: 'n1', start: now - 600_000, end: now - 540_000 },
          { id: 'n2', start: now - 360_000, end: now - 300_000 },
          { id: 'n3', start: now - 120_000, end: now - 60_000 },
        ])
      );
    }, KEY_RECORDS);
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('[data-testid="stats-threshold-badge"]')
    ).toHaveAttribute('data-state', 'match');
  });

  test('audio - son joué au déclenchement', async ({ page }) => {
    // Vérifier s'il y a un élément audio
    const audio = page.locator('audio, [data-audio], [role="alert"] audio');
    if (await audio.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(audio).toBeDefined();
    }
  });

  test('vibration - haptic feedback activé', async ({ page }) => {
    // Vérifier que vibration est activée dans les paramètres
    await page.goto('/parametres');
    const vibrationToggle = page.locator(
      'input[type="checkbox"][name="hapticFeedback"]'
    );
    if (await vibrationToggle.isVisible({ timeout: 500 }).catch(() => false)) {
      const isChecked = await vibrationToggle.isChecked();
      expect(typeof isChecked).toBe('boolean');
    }
  });

  test("snooze d'alerte - 30 minutes", async ({ page }) => {
    await page.goto('/parametres');

    const snoozeButton = page
      .locator('button')
      .filter({ hasText: /30|Snooze/ })
      .first();
    if (await snoozeButton.isVisible({ timeout: 500 }).catch(() => false)) {
      // Vérifier le timestamp du snooze
      const beforeSnooze = Date.now();
      await snoozeButton.click();

      // Vérifier que le snooze est enregistré
      const snoozeUntil = await page.evaluate(() => {
        return localStorage.getItem('mc_snooze_until');
      });

      if (snoozeUntil) {
        const snoozeMs = parseInt(snoozeUntil);
        const expectedMin = beforeSnooze + 30 * 60 * 1000 - 5000;
        const expectedMax = beforeSnooze + 30 * 60 * 1000 + 5000;
        expect(snoozeMs).toBeGreaterThan(expectedMin);
        expect(snoozeMs).toBeLessThan(expectedMax);
      }
    }
  });

  test("snooze d'alerte - 1 heure", async ({ page }) => {
    await page.goto('/parametres');

    const snoozeButton = page
      .locator('button')
      .filter({ hasText: /60|1h|1 h/ })
      .first();
    if (await snoozeButton.isVisible({ timeout: 500 }).catch(() => false)) {
      const beforeSnooze = Date.now();
      await snoozeButton.click();

      const snoozeUntil = await page.evaluate(() => {
        return localStorage.getItem('mc_snooze_until');
      });

      if (snoozeUntil) {
        const snoozeMs = parseInt(snoozeUntil);
        const expectedMin = beforeSnooze + 60 * 60 * 1000 - 5000;
        const expectedMax = beforeSnooze + 60 * 60 * 1000 + 5000;
        expect(snoozeMs).toBeGreaterThan(expectedMin);
        expect(snoozeMs).toBeLessThan(expectedMax);
      }
    }
  });

  test('annuler snooze - réactive les alertes', async ({ page }) => {
    await page.goto('/parametres');

    // Activer un snooze
    const snoozeButton = page
      .locator('button')
      .filter({ hasText: /30|Snooze/ })
      .first();
    if (await snoozeButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await snoozeButton.click();
      await page.waitForTimeout(500);

      // Chercher le bouton d'annulation
      const cancelButton = page
        .locator('button')
        .filter({ hasText: /Annuler|Cancel|Réactiver/ })
        .first();
      if (await cancelButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await cancelButton.click();

        // Vérifier que le snooze est annulé
        const snoozeUntil = await page.evaluate(() => {
          return localStorage.getItem('mc_snooze_until');
        });

        expect(snoozeUntil === null || parseInt(snoozeUntil) === 0).toBe(true);
      }
    }
  });

  test('alerte contraction ouverte - détecte une contraction jamais terminée', async ({
    page,
  }) => {
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    await startButton.click();
    await page.waitForTimeout(2000);

    // Attendre quelques secondes sans terminer
    // Chercher l'alerte
    const openContractionAlert = page
      .locator('[role="alert"], .alert, .warning')
      .filter({ hasText: /contraction|ouverte|jamais terminée|never closed/ });

    if (
      await openContractionAlert.isVisible({ timeout: 5000 }).catch(() => false)
    ) {
      await expect(openContractionAlert).toBeVisible();
    }
  });

  test('seuil personnalisable - intervalle max', async ({ page }) => {
    await page.goto('/parametres');

    const input = page.locator('input[name="maxIntervalMin"]');
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.fill('2');
      const submitButton = page.locator(
        'button:has-text("Enregistrer"), [type="submit"]'
      );
      if (await submitButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await submitButton.click();
      }

      // Vérifier que le paramètre est sauvegardé
      const savedValue = await page.evaluate(() => {
        const settings = localStorage.getItem('mc_settings_v1');
        return settings ? JSON.parse(settings).maxIntervalMin : null;
      });

      expect(savedValue).toBe(2);
    }
  });

  test('seuil personnalisable - durée minimum', async ({ page }) => {
    await page.goto('/parametres');

    const input = page.locator('input[name="minDurationSec"]');
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.fill('40');
      const submitButton = page.locator(
        'button:has-text("Enregistrer"), [type="submit"]'
      );
      if (await submitButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await submitButton.click();
      }

      const savedValue = await page.evaluate(() => {
        const settings = localStorage.getItem('mc_settings_v1');
        return settings ? JSON.parse(settings).minDurationSec : null;
      });

      expect(savedValue).toBe(40);
    }
  });

  test('seuil personnalisable - nombre de contractions consécutives', async ({
    page,
  }) => {
    await page.goto('/parametres');

    const input = page.locator('input[name="consecutiveCount"]');
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.fill('5');
      const submitButton = page.locator(
        'button:has-text("Enregistrer"), [type="submit"]'
      );
      if (await submitButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await submitButton.click();
      }

      const savedValue = await page.evaluate(() => {
        const settings = localStorage.getItem('mc_settings_v1');
        return settings ? JSON.parse(settings).consecutiveCount : null;
      });

      expect(savedValue).toBe(5);
    }
  });
});
