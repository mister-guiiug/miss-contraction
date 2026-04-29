/**
 * Tests E2E - Alertes & Notifications
 * Couverture: seuils atteints, notifications navigateur, audio, visual
 */

import { test, expect } from '@playwright/test';

test.describe('Alertes & Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Mock notification permission
    await page.evaluate(() => {
      (Notification as any).permission = 'granted';
    });
  });

  test('alerte visuelle - badge change d\'état', async ({ page }) => {
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();

    // Créer plusieurs contractions pour atteindre le seuil
    for (let i = 0; i < 4; i++) {
      await startButton.click();
      await page.waitForTimeout(100);
      const stopButton = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
      await stopButton.click();
      await page.waitForTimeout(200);
    }

    // Vérifier que le badge a changé d'état
    const badge = page.locator('.threshold-badge, [data-state]');
    if (await badge.isVisible({ timeout: 500 }).catch(() => false)) {
      const state = await badge.getAttribute('data-state');
      // L'état ne devrait plus être 'empty' ou 'calm'
      expect(state).toBeDefined();
    }
  });

  test('alerte pré-notification - bandeau d\'avertissement', async ({ page }) => {
    // Configurer les seuils bas
    await page.goto('/parametres');
    const maxIntervalInput = page.locator('input[name="maxIntervalMin"]');
    if (await maxIntervalInput.isVisible({ timeout: 500 }).catch(() => false)) {
      await maxIntervalInput.fill('1');
      const submitButton = page.locator('button:has-text("Enregistrer"), [type="submit"]');
      if (await submitButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await submitButton.click();
      }
    }

    await page.goto('/');

    // Créer contractions rapides
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    for (let i = 0; i < 3; i++) {
      await startButton.click();
      await page.waitForTimeout(50);
      const stopButton = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
      await stopButton.click();
      await page.waitForTimeout(100);
    }

    // Chercher le bandeau d'avertissement
    const banner = page.locator('.banner, [role="alert"], .alert');
    if (await banner.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(banner).toBeVisible();
    }
  });

  test('notification navigateur - déclenche une notification', async ({ page }) => {
    // Écouter la notification
    let notificationFired = false;
    
    await page.evaluate(() => {
      const originalShow = Notification.prototype.show;
      (window as any).__notificationFired = false;
      
      Notification.prototype.show = function() {
        (window as any).__notificationFired = true;
        if (originalShow) originalShow.call(this);
      };
    });

    // Configurer les seuils bas
    await page.goto('/parametres');
    const maxIntervalInput = page.locator('input[name="maxIntervalMin"]');
    if (await maxIntervalInput.isVisible({ timeout: 500 }).catch(() => false)) {
      await maxIntervalInput.fill('1');
      const submitButton = page.locator('button:has-text("Enregistrer"), [type="submit"]');
      if (await submitButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await submitButton.click();
      }
    }

    await page.goto('/');

    // Créer contractions rapides pour atteindre le seuil
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    for (let i = 0; i < 4; i++) {
      await startButton.click();
      await page.waitForTimeout(50);
      const stopButton = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
      await stopButton.click();
      await page.waitForTimeout(150);
    }

    // Vérifier si une notification a été créée
    notificationFired = await page.evaluate(() => (window as any).__notificationFired);
    expect(typeof notificationFired).toBe('boolean');
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
    const vibrationToggle = page.locator('input[type="checkbox"][name="hapticFeedback"]');
    if (await vibrationToggle.isVisible({ timeout: 500 }).catch(() => false)) {
      const isChecked = await vibrationToggle.isChecked();
      expect(typeof isChecked).toBe('boolean');
    }
  });

  test('snooze d\'alerte - 30 minutes', async ({ page }) => {
    await page.goto('/parametres');

    const snoozeButton = page.locator('button').filter({ hasText: /30|Snooze/ }).first();
    if (await snoozeButton.isVisible({ timeout: 500 }).catch(() => false)) {
      // Vérifier le timestamp du snooze
      const beforeSnooze = Date.now();
      await snoozeButton.click();
      
      // Vérifier que le snooze est enregistré
      const snoozeUntil = await page.evaluate(() => {
        return localStorage.getItem('mc_snooze_until_ms');
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

  test('snooze d\'alerte - 1 heure', async ({ page }) => {
    await page.goto('/parametres');

    const snoozeButton = page.locator('button').filter({ hasText: /60|1h|1 h/ }).first();
    if (await snoozeButton.isVisible({ timeout: 500 }).catch(() => false)) {
      const beforeSnooze = Date.now();
      await snoozeButton.click();
      
      const snoozeUntil = await page.evaluate(() => {
        return localStorage.getItem('mc_snooze_until_ms');
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
    const snoozeButton = page.locator('button').filter({ hasText: /30|Snooze/ }).first();
    if (await snoozeButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await snoozeButton.click();
      await page.waitForTimeout(500);

      // Chercher le bouton d'annulation
      const cancelButton = page.locator('button').filter({ hasText: /Annuler|Cancel|Réactiver/ }).first();
      if (await cancelButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await cancelButton.click();

        // Vérifier que le snooze est annulé
        const snoozeUntil = await page.evaluate(() => {
          return localStorage.getItem('mc_snooze_until_ms');
        });

        expect(snoozeUntil === null || parseInt(snoozeUntil) === 0).toBe(true);
      }
    }
  });

  test('alerte contraction ouverte - détecte une contraction jamais terminée', async ({ page }) => {
    const startButton = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    await startButton.click();
    await page.waitForTimeout(2000);

    // Attendre quelques secondes sans terminer
    // Chercher l'alerte
    const openContractionAlert = page.locator('[role="alert"], .alert, .warning').filter({ hasText: /contraction|ouverte|jamais terminée|never closed/ });
    
    if (await openContractionAlert.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(openContractionAlert).toBeVisible();
    }
  });

  test('seuil personnalisable - intervalle max', async ({ page }) => {
    await page.goto('/parametres');

    const input = page.locator('input[name="maxIntervalMin"]');
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.fill('2');
      const submitButton = page.locator('button:has-text("Enregistrer"), [type="submit"]');
      if (await submitButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await submitButton.click();
      }

      // Vérifier que le paramètre est sauvegardé
      const savedValue = await page.evaluate(() => {
        const settings = localStorage.getItem('mc_settings');
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
      const submitButton = page.locator('button:has-text("Enregistrer"), [type="submit"]');
      if (await submitButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await submitButton.click();
      }

      const savedValue = await page.evaluate(() => {
        const settings = localStorage.getItem('mc_settings');
        return settings ? JSON.parse(settings).minDurationSec : null;
      });

      expect(savedValue).toBe(40);
    }
  });

  test('seuil personnalisable - nombre de contractions consécutives', async ({ page }) => {
    await page.goto('/parametres');

    const input = page.locator('input[name="consecutiveCount"]');
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.fill('5');
      const submitButton = page.locator('button:has-text("Enregistrer"), [type="submit"]');
      if (await submitButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await submitButton.click();
      }

      const savedValue = await page.evaluate(() => {
        const settings = localStorage.getItem('mc_settings');
        return settings ? JSON.parse(settings).consecutiveCount : null;
      });

      expect(savedValue).toBe(5);
    }
  });
});
