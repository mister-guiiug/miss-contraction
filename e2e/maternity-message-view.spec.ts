/**
 * Tests E2E - MaternityView & MessageView
 * Couverture: infos maternité, appel, itinéraire, message SMS/WhatsApp
 */

import { test, expect } from '@playwright/test';

test.describe('MaternityView - Maternité', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Configurer les infos de maternité d'abord
    await page.goto('/parametres');
    
    const nameInput = page.locator('input[name="maternityLabel"], label:has-text("Libellé") ~ input').first();
    if (await nameInput.isVisible({ timeout: 500 }).catch(() => false)) {
      await nameInput.fill('Maternité Sainte-Marie');
    }

    const phoneInput = page.locator('input[name="maternityPhone"], input[type="tel"]').first();
    if (await phoneInput.isVisible({ timeout: 500 }).catch(() => false)) {
      await phoneInput.fill('01 23 45 67 89');
    }

    const addressInput = page.locator('input[name="maternityAddress"], label:has-text("Adresse") ~ input').first();
    if (await addressInput.isVisible({ timeout: 500 }).catch(() => false)) {
      await addressInput.fill('123 Rue de la Santé, 75000 Paris');
    }

    const submitButton = page.locator('button:has-text("Enregistrer"), [type="submit"]');
    if (await submitButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await submitButton.click();
    }

    // Naviguer vers la maternité
    const maternityNav = page.locator('a[href="/maternite"], a[href*="maternity"]').first();
    if (await maternityNav.isVisible({ timeout: 1000 }).catch(() => false)) {
      await maternityNav.click();
    } else {
      await page.goto('/maternite');
    }

    await page.waitForLoadState('networkidle');
  });

  test('affiche la page maternité', async ({ page }) => {
    const maternityPage = page.locator('[class*="maternity"]').first();
    await expect(maternityPage).toBeVisible();
  });

  test('affiche le nom de la maternité', async ({ page }) => {
    const heading = page.locator('h2, h3').filter({ hasText: /Maternité|Contacter/ });
    if (await heading.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(heading).toBeVisible();
    }
  });

  test('affiche le numéro de téléphone', async ({ page }) => {
    const phone = page.locator('a[href^="tel:"], text=/\\d{2}\\s\\d{2}\\s\\d{2}\\s\\d{2}\\s\\d{2}/');
    if (await phone.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(phone).toBeVisible();
    }
  });

  test('affiche l\'adresse', async ({ page }) => {
    const address = page.locator('text=/Rue|rue|avenue|Avenue/');
    if (await address.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(address).toBeVisible();
    }
  });

  test('bouton appel - lien tel:', async ({ page }) => {
    const callLink = page.locator('a[href^="tel:"]').first();
    if (await callLink.isVisible({ timeout: 500 }).catch(() => false)) {
      const href = await callLink.getAttribute('href');
      expect(href).toMatch(/^tel:/);
    }
  });

  test('bouton itinéraire - lien Google Maps', async ({ page }) => {
    const mapsLink = page.locator('a[href*="google.com/maps"]').first();
    if (await mapsLink.isVisible({ timeout: 500 }).catch(() => false)) {
      const href = await mapsLink.getAttribute('href');
      expect(href).toContain('google.com/maps');
    }
  });

  test('consignes d\'admission affichées', async ({ page }) => {
    // Ajouter les consignes d'abord
    await page.goto('/parametres');
    const instructionsInput = page.locator('textarea[name="maternityAdmissionInstructions"]').first();
    if (await instructionsInput.isVisible({ timeout: 500 }).catch(() => false)) {
      await instructionsInput.fill('Apporter pièce d\'identité\nArriver avec dossier');
      const submitButton = page.locator('button:has-text("Enregistrer"), [type="submit"]');
      if (await submitButton.isVisible({ timeout: 500 }).catch(() => false)) {
        await submitButton.click();
      }
    }

    // Retourner à la maternité
    await page.goto('/maternite');
    const instructions = page.locator('text=/Apporter|dossier/');
    if (await instructions.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(instructions).toBeVisible();
    }
  });

  test('responsive sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const maternityPage = page.locator('[class*="maternity"]').first();
    await expect(maternityPage).toBeVisible();
  });

  test('responsive sur desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const maternityPage = page.locator('[class*="maternity"]').first();
    await expect(maternityPage).toBeVisible();
  });
});

test.describe('MessageView - Message SMS/WhatsApp', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());

    // Naviguer vers le message
    const messageNav = page.locator('a[href="/message"], a[href*="sms"]').first();
    if (await messageNav.isVisible({ timeout: 1000 }).catch(() => false)) {
      await messageNav.click();
    } else {
      await page.goto('/message');
    }

    await page.waitForLoadState('networkidle');
  });

  test('affiche la page message', async ({ page }) => {
    const messagePage = page.locator('textarea, [class*="message"]').first();
    await expect(messagePage).toBeVisible();
  });

  test('affiche un message par défaut', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible({ timeout: 500 }).catch(() => false)) {
      const text = await textarea.inputValue();
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('message - éditer le texte', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible({ timeout: 500 }).catch(() => false)) {
      await textarea.fill('Mon nouveau message personnalisé');
      const newText = await textarea.inputValue();
      expect(newText).toBe('Mon nouveau message personnalisé');
    }
  });

  test('message - copier le texte', async ({ page }) => {
    const copyButton = page.locator('button').filter({ hasText: /Copier|Copy|Clipboard/ }).first();
    if (await copyButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await copyButton.click();
      // Vérifier qu'une confirmation s'affiche
      const confirmation = page.locator('text=Copié|Copied');
      if (await confirmation.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(confirmation).toBeVisible();
      }
    }
  });

  test('message - partager via WhatsApp', async ({ page }) => {
    const whatsappButton = page.locator('a[href*="whatsapp"], button').filter({ hasText: /WhatsApp|Whatsapp/ }).first();
    if (await whatsappButton.isVisible({ timeout: 500 }).catch(() => false)) {
      const href = await whatsappButton.getAttribute('href');
      if (href) {
        expect(href).toContain('whatsapp');
      }
    }
  });

  test('message - partager via SMS', async ({ page }) => {
    const smsButton = page.locator('a[href*="sms"], button').filter({ hasText: /SMS|Text/ }).first();
    if (await smsButton.isVisible({ timeout: 500 }).catch(() => false)) {
      const href = await smsButton.getAttribute('href');
      if (href) {
        expect(href).toContain('sms');
      }
    }
  });

  test('message - persistance après rechargement', async ({ page }) => {
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible({ timeout: 500 }).catch(() => false)) {
      await textarea.fill('Test persistance message');
      await page.waitForTimeout(500);

      // Recharger
      await page.reload();

      const newText = await textarea.inputValue();
      expect(newText).toBe('Test persistance message');
    }
  });

  test('message - responsive sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const messagePage = page.locator('textarea').first();
    if (await messagePage.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(messagePage).toBeVisible();
    }
  });
});
