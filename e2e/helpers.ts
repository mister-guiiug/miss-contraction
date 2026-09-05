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
 * Créer une contraction avec durée configurable.
 *
 * UN SEUL BOUTON. L'application bascule début / fin sur le même contrôle ; ce
 * helper cliquait `start-contraction-btn` puis `stop-contraction-btn`, deux
 * `data-testid` qui n'ont jamais existé. On attend le passage à l'état
 * « enregistrement » avant de compter la durée, sans quoi un clic avalé par le
 * rendu produirait une contraction fantôme.
 */
export async function createContraction(page: Page, durationMs = 500) {
  const toggle = page.locator(SELECTORS.TOGGLE_BTN);
  await expect(toggle).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });

  await toggle.click();
  await expect(page.locator(SELECTORS.TOGGLE_BTN_RECORDING)).toBeVisible({
    timeout: TIMEOUTS.ELEMENT_READY,
  });

  await page.waitForTimeout(durationMs);

  await toggle.click();
  await expect(page.locator(SELECTORS.TOGGLE_BTN_RECORDING)).toBeHidden({
    timeout: TIMEOUTS.ELEMENT_READY,
  });
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
 * Naviguer vers une vue.
 *
 * PAR URL, ET C'EST VOLONTAIRE. La version précédente cherchait d'abord un
 * `[data-testid="nav-home"]` et retombait sur `page.goto` — le crochet
 * n'existant pas, elle retombait toujours. Le détour ne servait donc à rien et
 * coûtait un `isVisible` avec temporisation à chaque navigation. La barre
 * basse vient du socle et n'offre aucune prise par onglet ; le test qui veut
 * éprouver la navigation elle-même clique le lien par son `href`
 * (`clickNavLink` ci-dessous).
 */
export async function navigateTo(page: Page, route: string) {
  await page.goto(route);
  await page.waitForLoadState('networkidle');
}

/**
 * Naviguer en cliquant, comme le ferait une utilisatrice.
 *
 * DEUX NAVIGATIONS COEXISTENT, SELON LA LARGEUR. La barre basse est
 * `display: none` au-delà de 767 px : sur desktop, c'est le tiroir qui sert,
 * ouvert par le bouton `#btn-menu`. Un helper qui ne connaîtrait que la barre
 * basse échouerait sur desktop — et c'est exactement ce qui arrivait au test
 * « navigation menu ».
 *
 * Réservé aux tests qui éprouvent la navigation ; partout ailleurs,
 * `navigateTo` va droit au but.
 */
export async function clickNavLink(page: Page, route: string) {
  const bottomLink = page.locator(`${SELECTORS.BOTTOM_NAV} a[href="${route}"]`);

  if (
    await bottomLink.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false)
  ) {
    await bottomLink.click();
  } else {
    // Le tiroir peut être resté ouvert d'une navigation précédente : le
    // rouvrir le refermerait, et sa toile de fond intercepterait le clic.
    const menuBtn = page.locator('#btn-menu');
    if ((await menuBtn.getAttribute('aria-expanded')) !== 'true') {
      await menuBtn.click();
    }

    const drawerLink = page.locator(`#app-drawer a[href="${route}"]`);
    await expect(drawerLink).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
    await drawerLink.click();
  }

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
  const saveBtn = page.locator(SELECTORS.SAVE_SETTINGS_BTN);
  await expect(saveBtn).toBeVisible({ timeout: TIMEOUTS.ELEMENT_READY });
  await saveBtn.click();

  // L'écran affiche un retour dédié : on l'attend plutôt que de chercher un
  // texte au jugé, comme le faisait `text=/Enregistré|Sauvegardé/i`.
  await expect(page.locator(SELECTORS.SETTINGS_SAVE_FEEDBACK)).toBeVisible({
    timeout: TIMEOUTS.NORMAL,
  });
}

/**
 * Vérifier qu'aucune erreur JavaScript ne s'est produite.
 *
 * ELLE N'EST PAS `async`, ET C'EST TOUT L'ENJEU. Elle ne fait qu'abonner un
 * écouteur et rendre les poignées pour le relire : rien à attendre. Déclarée
 * `async`, elle rendait une promesse, et les appels — dans les specs comme
 * dans `README.md` — l'utilisent sans `await`. `errorHandler.verify()` levait
 * donc `verify is not a function`, sur une promesse.
 *
 * Le défaut est là depuis la création de ce fichier (70d17e1, avril 2026) :
 * `run-e2e: false` dans la CI, personne ne lançait ces tests. Ce n'est pas une
 * régression du socle.
 */
export function expectNoJSErrors(page: Page) {
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
    },
  };
}

/**
 * Attendre qu'une contraction s'affiche dans l'historique
 */
export async function waitForContractionInHistory(page: Page) {
  const historyList = page.locator(SELECTORS.HISTORY_LIST);
  await expect(historyList).toBeVisible({ timeout: TIMEOUTS.NORMAL });

  // Les entrées portent `history-item-<id>` ; on vise la liste et sa première
  // ligne. `contraction-entry`, que ce helper attendait, n'a jamais existé.
  const entry = page.locator(`${SELECTORS.HISTORY_ITEMS} > li`).first();
  await expect(entry).toBeVisible({ timeout: TIMEOUTS.NORMAL });
}

/**
 * Récupérer les statistiques affichées.
 *
 * Les trois valeurs portent chacune leur `data-testid`. Ce helper lisait des
 * attributs `[data-stat="qty"]` qui n'existent nulle part dans `src/` : il
 * rendait donc toujours `null` quand la section était masquée, et levait
 * quand elle ne l'était pas.
 */
export async function getDisplayedStats(page: Page) {
  const statsSection = page.locator(SELECTORS.STATS_SECTION);

  if (
    !(await statsSection
      .isVisible({ timeout: TIMEOUTS.SHORT })
      .catch(() => false))
  ) {
    return null;
  }

  return {
    qtyPerHour: await page.locator(SELECTORS.STAT_VALUE_QTY).textContent(),
    avgDuration: await page
      .locator(SELECTORS.STAT_VALUE_DURATION)
      .textContent(),
    avgFrequency: await page
      .locator(SELECTORS.STAT_VALUE_FREQUENCY)
      .textContent(),
  };
}

/**
 * Vérifier l'état du badge de seuil
 */
export async function getThresholdBadgeState(page: Page) {
  const badge = page.locator(SELECTORS.THRESHOLD_BADGE);

  if (
    !(await badge.isVisible({ timeout: TIMEOUTS.SHORT }).catch(() => false))
  ) {
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
  const value = await page.evaluate(k => {
    const stored = localStorage.getItem(k);
    return stored ? JSON.parse(stored) : null;
  }, key);

  expect(value).toEqual(expectedValue);

  // Recharger et vérifier à nouveau
  await page.reload();
  await waitForPageReady(page);

  const reloadedValue = await page.evaluate(k => {
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

  /*
   * ON CLIQUE LE `<span>`, PAS LA CASE. Les bascules de l'écran de réglages
   * sont des `.field-check` : la `<input type="checkbox">` est masquée
   * (`opacity: 0; clip: rect(0,0,0,0)`) et c'est le `<span>` frère qui dessine
   * l'interrupteur. Playwright refuse de cliquer un élément invisible, et
   * `checkbox.click()` partait donc en timeout de 30 secondes — trois tests y
   * passaient. Le `<span>` étant dans le `<label>`, le clic bascule bien la
   * case.
   */
  await page.locator(`${selector} + span`).click();

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
