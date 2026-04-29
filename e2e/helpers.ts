/**
 * Helpers et utilitaires réutilisables pour les tests E2E
 */

import { Page, expect } from '@playwright/test';
import { TIMEOUTS, SELECTORS, ROUTES } from './config';

/**
 * Initialiser un test propre (localStorage vide, page chargée)
 */
export async function setupTest(page: Page) {
  await page.goto(ROUTES.HOME);
  await page.evaluate(() => localStorage.clear());
  await page.waitForLoadState('networkidle');
}

/**
 * Créer une contraction avec durée configurable
 */
export async function createContraction(page: Page, durationMs = 500) {
  const startBtn = page.locator(SELECTORS.START_BTN);
  await expect(startBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
  await startBtn.click();
  
  await page.waitForTimeout(durationMs);
  
  const stopBtn = page.locator(SELECTORS.STOP_BTN);
  await expect(stopBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
  await stopBtn.click();
  
  await page.waitForTimeout(200); // Attendre que localStorage se mette à jour
}

/**
 * Créer plusieurs contractions d'affilée
 */
export async function createMultipleContractions(
  page: Page,
  count: number,
  durationMs = 500,
  intervalMs = 300
) {
  for (let i = 0; i < count; i++) {
    await createContraction(page, durationMs);
    if (i < count - 1) {
      await page.waitForTimeout(intervalMs);
    }
  }
}

/**
 * Naviguer vers une vue via le menu ou directement
 */
export async function navigateTo(page: Page, route: string) {
  const navSelector = Object.entries(ROUTES).find(([_, v]) => v === route)?.[0];
  const navTestId = navSelector ? `nav-${navSelector.toLowerCase()}` : null;

  if (navTestId) {
    const navBtn = page.locator(`[data-testid="${navTestId}"]`);
    if (await navBtn.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
      await navBtn.click();
      await page.waitForLoadState('networkidle');
      return;
    }
  }

  // Fallback: navigation directe
  await page.goto(route);
  await page.waitForLoadState('networkidle');
}

/**
 * Remplir un champ de paramètre et sauvegarder
 */
export async function updateSetting(
  page: Page,
  selector: string,
  value: string | number
) {
  const input = page.locator(selector);
  await expect(input).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
  await input.fill(String(value));

  // Attendre que la valeur soit acceptée
  const currentValue = await input.inputValue();
  expect(currentValue).toBe(String(value));
}

/**
 * Sauvegarder les paramètres avec confirmation
 */
export async function saveSettings(page: Page) {
  const saveBtn = page.locator(SELECTORS.SAVE_BTN);
  if (await saveBtn.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
    await saveBtn.click();
    
    // Attendre la confirmation
    const confirmMsg = page.locator('text=/Enregistré|Sauvegardé/i');
    await expect(confirmMsg).toBeVisible({ timeout: TIMEOUTS.NORMAL }).catch(() => {
      // La confirmation n'est pas obligatoire
    });
  }
}

/**
 * Vérifier qu'aucune erreur JavaScript ne s'est produite
 */
export async function expectNoJSErrors(page: Page) {
  const errors: string[] = [];
  
  const errorHandler = (error: Error) => {
    errors.push(error.message);
  };

  page.on('pageerror', errorHandler);
  
  return {
    errors,
    cleanup: () => page.off('pageerror', errorHandler),
    verify: () => {
      expect(errors).toHaveLength(0);
    }
  };
}

/**
 * Attendre qu'une contraction s'affiche dans l'historique
 */
export async function waitForContractionInHistory(page: Page) {
  const historyList = page.locator(SELECTORS.HISTORY_LIST);
  await expect(historyList).toBeVisible({ timeout: TIMEOUTS.NORMAL });

  const entry = page.locator(SELECTORS.CONTRACTION_ENTRY).first();
  await expect(entry).toBeVisible({ timeout: TIMEOUTS.NORMAL });
}

/**
 * Récupérer les statistiques affichées
 */
export async function getDisplayedStats(page: Page) {
  const statsSection = page.locator(SELECTORS.STATS_SECTION);
  
  if (!await statsSection.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
    return null;
  }

  return {
    qtyPerHour: await statsSection.locator('[data-stat="qty"]').textContent(),
    avgDuration: await statsSection.locator('[data-stat="duration"]').textContent(),
    avgFrequency: await statsSection.locator('[data-stat="frequency"]').textContent(),
  };
}

/**
 * Vérifier l'état du badge de seuil
 */
export async function getThresholdBadgeState(page: Page) {
  const badge = page.locator(SELECTORS.THRESHOLD_BADGE);

  if (!await badge.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)) {
    return null;
  }

  return {
    state: await badge.getAttribute('data-state'),
    text: await badge.textContent(),
  };
}

/**
 * Attendre le chargement et confirmer que la page est prête
 */
export async function waitForPageReady(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Tester la persistence localStorage après rechargement
 */
export async function verifyLocalStoragePersistence(
  page: Page,
  key: string,
  expectedValue: any
) {
  const value = await page.evaluate((k) => {
    const stored = localStorage.getItem(k);
    return stored ? JSON.parse(stored) : null;
  }, key);

  expect(value).toEqual(expectedValue);

  // Recharger et vérifier à nouveau
  await page.reload();
  await waitForPageReady(page);

  const reloadedValue = await page.evaluate((k) => {
    const stored = localStorage.getItem(k);
    return stored ? JSON.parse(stored) : null;
  }, key);

  expect(reloadedValue).toEqual(expectedValue);
}

/**
 * Simuler la permission de notification
 */
export async function grantNotificationPermission(page: Page) {
  await page.evaluate(() => {
    (Notification as any).permission = 'granted';
  });
}

/**
 * Capturer une erreur si elle se produit
 */
export async function expectErrorToOccur(
  page: Page,
  action: () => Promise<void>,
  errorPattern?: RegExp
) {
  let errorCaught = false;
  let caughtError: string | null = null;

  const errorHandler = (error: Error) => {
    errorCaught = true;
    caughtError = error.message;
  };

  page.on('pageerror', errorHandler);

  try {
    await action();
  } finally {
    page.off('pageerror', errorHandler);
  }

  return {
    occurred: errorCaught,
    message: caughtError,
    matchesPattern: errorPattern ? errorPattern.test(caughtError || '') : null,
  };
}

/**
 * Activer/Désactiver un toggle
 */
export async function toggleCheckbox(page: Page, selector: string) {
  const checkbox = page.locator(selector);
  const isChecked = await checkbox.isChecked();
  await checkbox.click();

  const newChecked = await checkbox.isChecked();
  expect(newChecked).not.toBe(isChecked);

  return newChecked;
}

/**
 * Prendre une screenshot pour comparaison visuelle
 */
export async function takeScreenshot(page: Page, name: string) {
  return await page.screenshot({ path: `e2e/screenshots/${name}.png` });
}
