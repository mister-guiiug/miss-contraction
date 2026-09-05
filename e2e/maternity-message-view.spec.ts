/**
 * Tests E2E - MaternityView & MessageView
 * Couverture: infos maternité, appel, itinéraire, message SMS/WhatsApp
 *
 * ── RÉÉCRIT ──────────────────────────────────────────────────────────────────
 *
 * Le `beforeEach` remplissait les réglages avec des sélecteurs qui ne
 * désignaient rien : `input[name="maternityAddress"]` alors que l'adresse est
 * une `<textarea>`, `label:has-text("Libellé") ~ input` alors qu'aucun label
 * ne porte ce mot. Chaque remplissage étant gardé par
 * `if (await x.isVisible().catch(() => false))`, l'échec passait inaperçu : on
 * arrivait sur la vue maternité SANS AUCUNE donnée, et les tests qui
 * cherchaient un numéro de téléphone ne trouvaient rien — sans échouer pour
 * autant, puisqu'ils étaient gardés de la même façon.
 *
 * Deux erreurs de fond corrigées ici :
 *
 * - Les boutons WhatsApp et SMS ne sont PAS des liens. `MessageView` appelle
 *   `window.open()` : chercher `a[href*="whatsapp"]` ne pouvait rien donner.
 *   On intercepte `window.open` pour lire l'URL réellement demandée.
 * - Les « consignes d'admission » n'existent pas. Ni le réglage, ni
 *   l'affichage. Ce test est supprimé plutôt que laissé à vide.
 */

import { test, expect, type Page } from '@playwright/test';
import { SettingsPage } from './pages/SettingsPage';
import { ROUTES, SELECTORS, TEST_DATA } from './config';

const {
  name: MATERNITY_NAME,
  phone: PHONE,
  address: ADDRESS,
} = TEST_DATA.maternity;

/** Capture l'URL passée à `window.open`, que les partages utilisent. */
async function captureWindowOpen(page: Page) {
  await page.evaluate(() => {
    (window as unknown as { __opened: string[] }).__opened = [];
    window.open = (url?: string | URL) => {
      (window as unknown as { __opened: string[] }).__opened.push(String(url));
      return null;
    };
  });
  return () =>
    page.evaluate(() => (window as unknown as { __opened: string[] }).__opened);
}

test.describe('MaternityView - Maternité', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());

    const settings = new SettingsPage(page);
    await settings.goto();
    await settings.setMaternityName(MATERNITY_NAME);
    await settings.setMaternityPhone(PHONE);
    await settings.setMaternityAddress(ADDRESS);
    await settings.save();

    await page.goto(ROUTES.MATERNITY);
    await page.waitForLoadState('networkidle');
  });

  test('affiche la page maternité', async ({ page }) => {
    await expect(page.locator(SELECTORS.MATERNITY_VIEW)).toBeVisible();
    await expect(
      page.locator('[data-testid="maternity-call-section"]')
    ).toBeVisible();
  });

  test('affiche le nom de la maternité', async ({ page }) => {
    await expect(page.locator(SELECTORS.MATERNITY_LABEL)).toHaveText(
      MATERNITY_NAME
    );
  });

  test('affiche le numéro de téléphone, normalisé', async ({ page }) => {
    // `sanitizePhone` ne garde que les chiffres et le `+` : saisi
    // « 01 23 45 67 89 », le numéro est relu et affiché « 0123456789 ».
    await expect(page.locator('[data-testid="maternity-phone"]')).toContainText(
      PHONE.replace(/[^\d+]/g, '')
    );
    // Le substitut ne doit pas être monté quand un numéro est réglé.
    await expect(
      page.locator('[data-testid="maternity-phone-placeholder"]')
    ).toHaveCount(0);
  });

  test("affiche l'adresse", async ({ page }) => {
    await expect(
      page.locator('[data-testid="maternity-address"]')
    ).toContainText('Rue de la Santé');
  });

  test('bouton appel - lien tel: sans espaces', async ({ page }) => {
    // `MaternityView` retire les espaces : une URI `tel:` n'en accepte pas.
    await expect(page.locator(SELECTORS.MATERNITY_CALL_BTN)).toHaveAttribute(
      'href',
      `tel:${PHONE.replace(/\s/g, '')}`
    );
  });

  test('bouton itinéraire - lien Google Maps vers l’adresse', async ({
    page,
  }) => {
    const href = await page
      .locator(SELECTORS.MATERNITY_MAPS_BTN)
      .getAttribute('href');

    expect(href).toContain('google.com/maps');
    expect(href).toContain(encodeURIComponent(ADDRESS));
  });

  test('sans réglage - affiche les substituts plutôt que des liens morts', async ({
    page,
  }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await page.goto(ROUTES.MATERNITY);
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('[data-testid="maternity-phone-placeholder"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="maternity-address-placeholder"]')
    ).toBeVisible();
  });

  for (const [label, width, height] of [
    ['mobile', 375, 667],
    ['desktop', 1920, 1080],
  ] as const) {
    test(`responsive sur ${label}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await expect(page.locator(SELECTORS.MATERNITY_VIEW)).toBeVisible();
      await expect(page.locator(SELECTORS.MATERNITY_CALL_BTN)).toBeVisible();
    });
  }
});

test.describe('MessageView - Message SMS/WhatsApp', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.HOME);
    await page.evaluate(() => localStorage.clear());
    await page.goto(ROUTES.MESSAGE);
    await page.waitForLoadState('networkidle');
  });

  test('affiche la page message', async ({ page }) => {
    await expect(page.locator(SELECTORS.MESSAGE_VIEW)).toBeVisible();
    await expect(page.locator(SELECTORS.MESSAGE_TEXTAREA)).toBeVisible();
  });

  test('affiche un message par défaut non vide', async ({ page }) => {
    const value = await page.locator(SELECTORS.MESSAGE_TEXTAREA).inputValue();
    expect(value.trim().length).toBeGreaterThan(0);
  });

  test('message - éditer le texte', async ({ page }) => {
    const textarea = page.locator(SELECTORS.MESSAGE_TEXTAREA);
    await textarea.fill('Mon nouveau message personnalisé');
    await expect(textarea).toHaveValue('Mon nouveau message personnalisé');
  });

  test('message - copier le texte affiche une confirmation', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.locator(SELECTORS.MESSAGE_COPY_BTN).click();

    await expect(page.locator(SELECTORS.MESSAGE_FEEDBACK)).toContainText(
      'copié'
    );
  });

  test('message - partager via WhatsApp ouvre wa.me avec le texte', async ({
    page,
  }) => {
    const textarea = page.locator(SELECTORS.MESSAGE_TEXTAREA);
    await textarea.fill('Message WhatsApp de test');

    const opened = await captureWindowOpen(page);
    await page.locator(SELECTORS.MESSAGE_WHATSAPP_BTN).click();

    const urls = await opened();
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('https://wa.me/?text=');
    expect(urls[0]).toContain(encodeURIComponent('Message WhatsApp de test'));
  });

  test('message - partager via SMS ouvre une URI sms:', async ({ page }) => {
    const textarea = page.locator(SELECTORS.MESSAGE_TEXTAREA);
    await textarea.fill('Message SMS de test');

    const opened = await captureWindowOpen(page);
    await page.locator(SELECTORS.MESSAGE_SMS_BTN).click();

    const urls = await opened();
    expect(urls).toHaveLength(1);
    expect(urls[0]).toContain('sms:?body=');
    expect(urls[0]).toContain(encodeURIComponent('Message SMS de test'));
  });

  test('message - persistance après rechargement', async ({ page }) => {
    const textarea = page.locator(SELECTORS.MESSAGE_TEXTAREA);
    await textarea.fill('Test persistance message');
    // L'écriture est différée : on attend que la valeur reparte du stockage.
    await page.waitForTimeout(600);

    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator(SELECTORS.MESSAGE_TEXTAREA)).toHaveValue(
      'Test persistance message'
    );
  });

  test('message - responsive sur mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator(SELECTORS.MESSAGE_TEXTAREA)).toBeVisible();
    await expect(page.locator(SELECTORS.MESSAGE_WHATSAPP_BTN)).toBeVisible();
  });
});
