/**
 * Tests E2E - SettingsView
 * Couverture: seuils, maternité, notifications, snooze, thème, grand confort
 *
 * ── RÉÉCRIT ──────────────────────────────────────────────────────────────────
 *
 * Le `beforeEach` cliquait `a[href="/parametres"], a[href*="settings"]`, dont
 * le premier résultat est le lien du TIROIR fermé : invisible pour
 * l'utilisatrice, « visible et stable » pour Playwright. Le clic n'aboutissait
 * jamais et les vingt tests tombaient en timeout de 30 secondes.
 *
 * Les tests eux-mêmes étaient enveloppés dans
 * `if (await x.isVisible().catch(() => false)) { … }` : un champ absent ou mal
 * nommé faisait PASSER le test. Ils cherchaient des `input[name="…"]` et des
 * `label:has-text("intervalle max")` là où l'écran expose des `data-testid`.
 * On passe par `SettingsPage`, et chaque test conclut désormais sur une
 * assertion qui peut échouer.
 */

import { test, expect } from '@playwright/test';
import { SettingsPage } from './pages/SettingsPage';
import {
  ROUTES,
  SELECTORS,
  TEST_DATA,
  KEY_SETTINGS,
  KEY_SNOOZE_UNTIL,
  KEY_RECORDS,
  LS_THEME,
} from './config';

/** Relit l'échéance du report d'alertes, ou `null` si aucun n'est posé. */
async function snoozeUntil(page: import('@playwright/test').Page) {
  return await page.evaluate(key => {
    const raw = localStorage.getItem(key);
    return raw ? Number(raw) : null;
  }, KEY_SNOOZE_UNTIL);
}

/** Relit les réglages persistés, tels que l'application les a écrits. */
async function storedSettings(page: import('@playwright/test').Page) {
  return await page.evaluate(key => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, KEY_SETTINGS);
}

test.describe('SettingsView - Paramètres', () => {
  let settings: SettingsPage;

  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    settings = new SettingsPage(page);
    await settings.goto();
  });

  test('affiche la page des paramètres', async ({ page }) => {
    await expect(page.locator(SELECTORS.SETTINGS_VIEW)).toBeVisible();
    await expect(page.locator('[data-testid="settings-form"]')).toBeVisible();
  });

  test('paramètres seuils - les trois valeurs sont persistées', async ({
    page,
  }) => {
    const { maxIntervalMin, minDurationSec, consecutiveCount } =
      TEST_DATA.settings;

    await settings.setMaxInterval(maxIntervalMin);
    await settings.setMinDuration(minDurationSec);
    await settings.setConsecutiveCount(consecutiveCount);
    await settings.save();

    expect(await storedSettings(page)).toMatchObject({
      maxIntervalMin,
      minDurationSec,
      consecutiveCount,
    });
  });

  test('paramètres seuils - les valeurs sont relues au rechargement', async ({
    page,
  }) => {
    await settings.setMaxInterval(TEST_DATA.settings.maxIntervalMin);
    await settings.save();

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SELECTORS.MAX_INTERVAL_INPUT)).toHaveValue(
      String(TEST_DATA.settings.maxIntervalMin)
    );
  });

  test('maternité - nom, téléphone et adresse sont persistés', async ({
    page,
  }) => {
    const { name, phone, address } = TEST_DATA.maternity;

    await settings.setMaternityName(name);
    await settings.setMaternityPhone(phone);
    await settings.setMaternityAddress(address);
    await settings.save();

    expect(await storedSettings(page)).toMatchObject({
      maternityLabel: name,
      maternityPhone: phone,
      maternityAddress: address,
    });
  });

  test('maternité - les valeurs remontent sur la vue maternité', async ({
    page,
  }) => {
    const { name } = TEST_DATA.maternity;
    await settings.setMaternityName(name);
    await settings.setMaternityPhone(TEST_DATA.maternity.phone);
    await settings.save();

    await page.goto(ROUTES.MATERNITY);
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SELECTORS.MATERNITY_LABEL)).toContainText(name);
  });

  test('notifications - le bouton de permission est présent', async ({
    page,
  }) => {
    // Le navigateur de test n'accorde rien : on vérifie que la commande
    // existe et que l'écran affiche un état, pas que la permission passe.
    await expect(
      page.locator('[data-testid="request-notification-btn"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="notification-status"]')
    ).toBeVisible();
  });

  /*
   * Le bouton « Annuler le report » est TOUJOURS rendu — il ne disparaît pas
   * une fois le report levé. C'est donc `mc_snooze_until` qu'on interroge, pas
   * la présence du bouton ; et le message de statut s'efface au bout de trois
   * secondes, il ne peut pas servir de preuve durable.
   */
  test('snooze - reporter les alertes 30 min puis annuler', async ({
    page,
  }) => {
    await settings.snooze(30);
    await expect(page.locator('[data-testid="snooze-status"]')).toContainText(
      '30 min'
    );
    expect(await snoozeUntil(page)).toBeGreaterThan(Date.now());

    await settings.cancelSnooze();
    await expect(page.locator('[data-testid="snooze-status"]')).toContainText(
      'réactivées'
    );
    expect(await snoozeUntil(page)).toBeNull();
  });

  test('snooze - reporter les alertes 1 h', async ({ page }) => {
    const before = Date.now();
    await settings.snooze(60);

    const until = await snoozeUntil(page);
    expect(until).not.toBeNull();
    // Une heure, à la seconde de latence près.
    expect(until! - before).toBeGreaterThan(59 * 60_000);
    expect(until! - before).toBeLessThan(61 * 60_000);
  });

  /*
   * C'EST LA PRÉFÉRENCE QUI TOURNE, PAS FORCÉMENT L'APPARENCE. Le cycle va
   * système → clair → sombre → système, et `data-theme` porte le thème
   * RÉSOLU. Sous Playwright, `prefers-color-scheme` vaut `light` : partir de
   * « système » pour aller à « clair » ne change donc rien à l'attribut.
   * Guetter `data-theme` faisait échouer ce test sans qu'aucun bug n'existe.
   */
  test('thème - le bouton fait tourner la préférence', async ({ page }) => {
    const read = () =>
      page.evaluate(key => localStorage.getItem(key), LS_THEME);

    await settings.toggleTheme();
    expect(await read()).toBe('light');

    await settings.toggleTheme();
    expect(await read()).toBe('dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    await settings.toggleTheme();
    expect(await read()).toBe('system');
  });

  test('contraste élevé - la bascule pose l’attribut sur <html>', async ({
    page,
  }) => {
    const enabled = await settings.toggleHighContrast();
    expect(enabled).toBe(true);

    await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
  });

  test('grand confort - la bascule est persistée', async ({ page }) => {
    const enabled = await settings.toggleLargeMode();
    expect(enabled).toBe(true);

    await settings.save();
    expect(await storedSettings(page)).toMatchObject({ largeMode: true });
  });

  test('vibrations - la bascule est persistée', async ({ page }) => {
    // Elle est active par défaut : la première bascule la désactive.
    const enabled = await settings.toggleVibration();
    expect(enabled).toBe(false);

    await settings.save();
    expect(await storedSettings(page)).toMatchObject({
      vibrationEnabled: false,
    });
  });

  test('sauvegarde - affiche une confirmation', async ({ page }) => {
    await settings.setMaxInterval(TEST_DATA.settings.maxIntervalMin);
    await settings.save();

    const feedback = page.locator(SELECTORS.SETTINGS_SAVE_FEEDBACK);
    await expect(feedback).toBeVisible();
    await expect(feedback).not.toBeEmpty();
  });

  test('effacement - demande confirmation puis vide l’historique', async ({
    page,
  }) => {
    // Semer deux contractions, puis les effacer depuis l'accueil.
    await page.goto(ROUTES.HOME);
    await page.evaluate(key => {
      const now = Date.now();
      localStorage.setItem(
        key,
        JSON.stringify([
          { id: 'a', start: now - 120000, end: now - 119000 },
          { id: 'b', start: now - 60000, end: now - 59000 },
        ])
      );
    }, KEY_RECORDS);
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator(`${SELECTORS.HISTORY_ITEMS} > li`)).toHaveCount(
      2
    );

    await settings.clearAllData();

    // Sans contraction, `HomeView` remplace toute la liste par l'état vide du
    // socle : `history-empty` n'est jamais monté dans ce cas.
    await expect(page.locator(SELECTORS.EMPTY_STATE)).toBeVisible();
    await expect(page.locator(SELECTORS.HISTORY_ITEMS)).toHaveCount(0);
  });

  test('persistance - les paramètres survivent au rechargement', async ({
    page,
  }) => {
    await settings.setMaternityName(TEST_DATA.maternity.name);
    await settings.setMinDuration(TEST_DATA.settings.minDurationSec);
    await settings.save();

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SELECTORS.MATERNITY_LABEL_INPUT)).toHaveValue(
      TEST_DATA.maternity.name
    );
    await expect(page.locator(SELECTORS.MIN_DURATION_INPUT)).toHaveValue(
      String(TEST_DATA.settings.minDurationSec)
    );
  });
});
