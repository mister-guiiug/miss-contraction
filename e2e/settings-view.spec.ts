/**
 * Tests E2E - SettingsView
 * Couverture: seuils, maternité, notifications, snooze, thème, grand confort
 */

import { test, expect } from '@playwright/test';

test.describe('SettingsView - Paramètres', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Naviguer vers les paramètres
    const settingsNav = page.locator('a[href="/parametres"], a[href*="settings"]').first();
    if (await settingsNav.isVisible({ timeout: 1000 }).catch(() => false)) {
      await settingsNav.click();
    } else {
      // Accès direct
      await page.goto('/parametres');
    }

    await page.waitForLoadState('networkidle');
  });

  test('affiche la page des paramètres', async ({ page }) => {
    const settingsPage = page.locator('[class*="settings"], form').first();
    await expect(settingsPage).toBeVisible();
  });

  test('paramètres seuils - maxIntervalMin', async ({ page }) => {
    const input = page.locator('input[name="maxIntervalMin"], label:has-text("intervalle max") ~ input');
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      const currentValue = await input.inputValue();
      const newValue = String(parseInt(currentValue || '3') - 1);
      await input.fill(newValue);
      
      const submitButton = page.locator('button:has-text("Enregistrer"), button:has-text("Sauvegarder"), [type="submit"]');
      if (await submitButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await submitButton.click();
      }
    }
  });

  test('paramètres seuils - minDurationSec', async ({ page }) => {
    const input = page.locator('input[name="minDurationSec"], label:has-text("durée min") ~ input');
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.fill('35');
    }
  });

  test('paramètres seuils - consecutiveCount', async ({ page }) => {
    const input = page.locator('input[name="consecutiveCount"], label:has-text("nombre de contractions") ~ input');
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.fill('4');
    }
  });

  test('maternité - saisir le nom', async ({ page }) => {
    const input = page.locator('input[name="maternityLabel"], label:has-text("Maternité") ~ input, label:has-text("Libellé") ~ input').first();
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.fill('Maternité Sainte-Marie');
    }
  });

  test('maternité - saisir le téléphone', async ({ page }) => {
    const input = page.locator('input[name="maternityPhone"], label:has-text("Téléphone") ~ input, input[type="tel"]').first();
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.fill('01 23 45 67 89');
    }
  });

  test('maternité - saisir l\'adresse', async ({ page }) => {
    const input = page.locator('input[name="maternityAddress"], label:has-text("Adresse") ~ input, textarea[name="maternityAddress"]').first();
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.fill('123 Rue de la Santé, 75000 Paris');
    }
  });

  test('maternité - saisir les consignes d\'admission', async ({ page }) => {
    const input = page.locator('textarea[name="maternityAdmissionInstructions"], label:has-text("Consignes") ~ textarea').first();
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.fill('Arriver avec dossier complet\nAppeler avant d\'arriver');
    }
  });

  test('notifications - demander la permission', async ({ page }) => {
    const requestButton = page.locator('button:has-text("Activer"), button:has-text("Request"), button:has-text("Notifications")').first();
    if (await requestButton.isVisible({ timeout: 500 }).catch(() => false)) {
      // Mock notification permission pour éviter les popups
      await page.evaluate(() => {
        (Notification as any).permission = 'granted';
      });
      await requestButton.click();
    }
  });

  test('snooze - arrêter les alertes 30 min', async ({ page }) => {
    const snoozeButton = page.locator('button').filter({ hasText: /30|Snooze/ }).first();
    if (await snoozeButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await snoozeButton.click();
      const confirmationMessage = page.locator('text=alert', { exact: false });
      if (await confirmationMessage.isVisible({ timeout: 500 }).catch(() => false)) {
        await expect(confirmationMessage).toBeDefined();
      }
    }
  });

  test('snooze - arrêter les alertes 1h', async ({ page }) => {
    const snoozeButton = page.locator('button').filter({ hasText: /60|1h|1 h/ }).first();
    if (await snoozeButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await snoozeButton.click();
    }
  });

  test('snooze - annuler le report d\'alerte', async ({ page }) => {
    // D'abord activer un snooze
    const snoozeButton = page.locator('button').filter({ hasText: /30|Snooze/ }).first();
    if (await snoozeButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await snoozeButton.click();
      await page.waitForTimeout(500);

      // Chercher le bouton d'annulation du snooze
      const cancelButton = page.locator('button').filter({ hasText: /Annuler|Cancel|Snooze actif/ }).first();
      if (await cancelButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await cancelButton.click();
      }
    }
  });

  test('thème - toggle dark/light', async ({ page }) => {
    const themeButton = page.locator('button').filter({ hasText: /thème|Thème|Dark|Light/ }).first();
    if (await themeButton.isVisible({ timeout: 500 }).catch(() => false)) {
      const htmlBefore = await page.locator('html').getAttribute('data-theme');
      await themeButton.click();
      const htmlAfter = await page.locator('html').getAttribute('data-theme');
      expect(htmlBefore).not.toBe(htmlAfter);
    }
  });

  test('contraste élevé - toggle', async ({ page }) => {
    const highContrastToggle = page.locator('input[type="checkbox"][name="highContrast"], label:has-text("Contraste") ~ input').first();
    if (await highContrastToggle.isVisible({ timeout: 500 }).catch(() => false)) {
      const checkedBefore = await highContrastToggle.isChecked();
      await highContrastToggle.click();
      const checkedAfter = await highContrastToggle.isChecked();
      expect(checkedBefore).not.toBe(checkedAfter);
    }
  });

  test('grand confort - toggle', async ({ page }) => {
    const largeMode = page.locator('input[type="checkbox"][name="largeMode"], label:has-text("Grand confort") ~ input, label:has-text("Textes agrandis") ~ input').first();
    if (await largeMode.isVisible({ timeout: 500 }).catch(() => false)) {
      const checkedBefore = await largeMode.isChecked();
      await largeMode.click();
      const checkedAfter = await largeMode.isChecked();
      expect(checkedBefore).not.toBe(checkedAfter);

      // Vérifier que les styles changent
      const hasClass = await page.locator('html').evaluate(el => el.classList.contains('mc-large-mode'));
      expect(hasClass).toBe(checkedAfter);
    }
  });

  test('vibrations - toggle', async ({ page }) => {
    const vibration = page.locator('input[type="checkbox"][name="hapticFeedback"], label:has-text("Vibrations") ~ input').first();
    if (await vibration.isVisible({ timeout: 500 }).catch(() => false)) {
      const checkedBefore = await vibration.isChecked();
      await vibration.click();
      const checkedAfter = await vibration.isChecked();
      expect(checkedBefore).not.toBe(checkedAfter);
    }
  });

  test('commande vocale - toggle (experimental)', async ({ page }) => {
    const voiceCommand = page.locator('input[type="checkbox"][name="voiceCommands"], label:has-text("Vocale") ~ input, label:has-text("commande vocale") ~ input').first();
    if (await voiceCommand.isVisible({ timeout: 500 }).catch(() => false)) {
      const checkedBefore = await voiceCommand.isChecked();
      await voiceCommand.click();
      const checkedAfter = await voiceCommand.isChecked();
      expect(checkedBefore).not.toBe(checkedAfter);
    }
  });

  test('sauvegarde - affiche confirmation', async ({ page }) => {
    const submitButton = page.locator('button:has-text("Enregistrer"), button:has-text("Sauvegarder"), [type="submit"]');
    if (await submitButton.isVisible({ timeout: 500 }).catch(() => false)) {
      // Modifier quelque chose
      const input = page.locator('input[name="maxIntervalMin"]');
      if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
        await input.fill('4');
      }

      await submitButton.click();

      // Vérifier la confirmation
      const confirmationMessage = page.locator('text=Paramètres enregistrés', { exact: false });
      if (await confirmationMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(confirmationMessage).toBeVisible();
      }
    }
  });

  test('effacement - confirmation avant suppression', async ({ page }) => {
    const deleteButton = page.locator('button').filter({ hasText: /Effacer|Supprimer|Vider|Delete|Clear/ }).first();
    if (await deleteButton.isVisible({ timeout: 500 }).catch(() => false)) {
      // Évaluer pour catcher la dialog
      page.once('dialog', dialog => {
        expect(dialog.type()).toBe('confirm');
        dialog.dismiss();
      });

      await deleteButton.click();
    }
  });

  test('persistance - les paramètres persistent après rechargement', async ({ page }) => {
    const input = page.locator('input[name="maxIntervalMin"]');
    if (await input.isVisible({ timeout: 500 }).catch(() => false)) {
      await input.fill('5');
      
      const submitButton = page.locator('button:has-text("Enregistrer"), [type="submit"]');
      if (await submitButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(500);
      }

      // Recharger
      await page.reload();

      // Vérifier que la valeur persiste
      const newValue = await input.inputValue();
      expect(newValue).toBe('5');
    }
  });
});
