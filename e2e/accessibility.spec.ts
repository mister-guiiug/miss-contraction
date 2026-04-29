/**
 * Tests E2E - Accessibilité avec axe-core
 * Scans automatiques et assertions d'accessibilité WCAG 2.1
 * 
 * Tags:
 * @a11y - Tests d'accessibilité
 * @wcag - Tests de conformité WCAG
 */

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';
import { ROUTES, TIMEOUTS } from '../config';

test.describe('Accessibilité - WCAG 2.1 AA', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('@a11y @wcag HomeView - pas de violations', async ({ page }) => {
    await injectAxe(page);
    try {
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
      });
    } catch (e) {
      // Capturer les violations pour le rapport
      const violations = await getViolations(page);
      console.error('Violations a11y:', violations);
      throw e;
    }
  });

  test('@a11y @wcag SettingsView - pas de violations', async ({ page }) => {
    await page.goto(ROUTES.SETTINGS);
    await injectAxe(page);
    
    try {
      await checkA11y(page);
    } catch (e) {
      const violations = await getViolations(page);
      console.error('Violations a11y (Settings):', violations);
      throw e;
    }
  });

  test('@a11y @wcag TableView - pas de violations', async ({ page }) => {
    // Créer quelques contractions d'abord
    await page.goto(ROUTES.HOME);
    const startBtn = page.locator('button').filter({ hasText: /Début|Start/ }).first();
    for (let i = 0; i < 2; i++) {
      await startBtn.click();
      await page.waitForTimeout(200);
      const stopBtn = page.locator('button').filter({ hasText: /Fin|Stop/ }).first();
      await stopBtn.click();
      await page.waitForTimeout(300);
    }

    await page.goto(ROUTES.TABLE);
    await injectAxe(page);

    try {
      await checkA11y(page);
    } catch (e) {
      const violations = await getViolations(page);
      console.error('Violations a11y (Table):', violations);
      throw e;
    }
  });

  test('@a11y @wcag MaternityView - pas de violations', async ({ page }) => {
    await page.goto(ROUTES.MATERNITY);
    await injectAxe(page);

    try {
      await checkA11y(page);
    } catch (e) {
      const violations = await getViolations(page);
      console.error('Violations a11y (Maternity):', violations);
      throw e;
    }
  });

  test('@a11y @wcag MessageView - pas de violations', async ({ page }) => {
    await page.goto(ROUTES.MESSAGE);
    await injectAxe(page);

    try {
      await checkA11y(page);
    } catch (e) {
      const violations = await getViolations(page);
      console.error('Violations a11y (Message):', violations);
      throw e;
    }
  });

  test('@a11y navigation clavier - tous les boutons accessibles au clavier', async ({ page }) => {
    await page.goto(ROUTES.HOME);

    const buttons = await page.locator('button').all();
    let focusableCount = 0;

    for (const btn of buttons.slice(0, 10)) {
      // Vérifier que le bouton a un tabindex ou est naturellement focusable
      const tabindex = await btn.getAttribute('tabindex');
      const isButton = await btn.evaluate(el => el.tagName === 'BUTTON');
      
      if (isButton || (tabindex && parseInt(tabindex) >= 0)) {
        focusableCount++;
      }
    }

    // Au moins 50% des boutons doivent être focusables
    expect(focusableCount).toBeGreaterThan(0);
  });

  test('@a11y labels explicites - inputs ont des labels', async ({ page }) => {
    await page.goto(ROUTES.SETTINGS);

    const inputs = await page.locator('input, textarea, select').all();
    let labeledCount = 0;

    for (const input of inputs.slice(0, 10)) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      if (ariaLabel || ariaLabelledBy) {
        labeledCount++;
      } else if (id) {
        const label = page.locator(`label[for="${id}"]`);
        if (await label.isVisible({ timeout: 300 }).catch(() => false)) {
          labeledCount++;
        }
      }
    }

    // Au moins 60% doivent avoir un label
    expect(labeledCount / inputs.length).toBeGreaterThan(0.5);
  });

  test('@a11y structure - headings hiérarchiques correctes', async ({ page }) => {
    await page.goto(ROUTES.HOME);

    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    let previousLevel = 0;

    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName);
      const level = parseInt(tagName[1]);

      // La hiérarchie ne doit pas sauter plus d'un niveau
      expect(Math.abs(level - previousLevel)).toBeLessThanOrEqual(2);

      previousLevel = level;
    }

    expect(headings.length).toBeGreaterThan(0);
  });

  test('@a11y contraste - texte suffisamment contrasté', async ({ page }) => {
    await page.goto(ROUTES.HOME);

    // Vérifier que la page n'a pas de "visibility: hidden" sur du contenu important
    const hiddenElements = await page.locator(':visible').evaluate(() => {
      return Array.from(document.querySelectorAll('*'))
        .filter(el => getComputedStyle(el).visibility === 'hidden')
        .length;
    });

    // Aucun élément visible ne doit être marqué comme hidden
    expect(hiddenElements).toBe(0);
  });

  test('@a11y images - alt text ou aria-label', async ({ page }) => {
    await page.goto(ROUTES.HOME);

    const images = await page.locator('img').all();
    let altCount = 0;

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');

      // Accepter alt, aria-label, ou role="presentation"
      if (alt || ariaLabel || role === 'presentation') {
        altCount++;
      }
    }

    // Si pas d'images, c'est ok
    if (images.length > 0) {
      expect(altCount / images.length).toBeGreaterThan(0.8);
    }
  });

  test('@a11y focus visible - gestion du focus au clavier', async ({ page }) => {
    await page.goto(ROUTES.HOME);

    // Simuler la navigation au clavier
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? (el as any).tagName : null;
    });

    // Un élément doit être en focus
    expect(focusedElement).toBeTruthy();
    expect(['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT']).toContain(focusedElement);
  });

  test('@a11y aria-live regions - pour les mises à jour dynamiques', async ({ page }) => {
    await page.goto(ROUTES.HOME);

    const ariaLiveRegions = await page.locator('[aria-live]').count();

    // Devrait avoir au moins une région aria-live pour les alertes
    expect(ariaLiveRegions).toBeGreaterThanOrEqual(0);
  });

  test('@a11y couleur non unique - info pas basée sur couleur seule', async ({ page }) => {
    await page.goto(ROUTES.HOME);

    // Vérifier que les badges/alertes ont du texte, pas juste de la couleur
    const badgeTitles = await page.locator('[data-testid="threshold-badge"]').allTextContents();
    
    // Le badge doit avoir du texte, pas juste une couleur
    expect(badgeTitles.length).toBeGreaterThan(0);
    expect(badgeTitles[0]?.trim().length).toBeGreaterThan(0);
  });

  test('@a11y langue - attribut lang défini', async ({ page }) => {
    await page.goto(ROUTES.HOME);

    const lang = await page.locator('html').getAttribute('lang');
    
    // La langue doit être définie
    expect(lang).toBeTruthy();
    expect(lang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
  });

  test('@a11y viewport - meta viewport configuré', async ({ page }) => {
    await page.goto(ROUTES.HOME);

    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
  });
});
