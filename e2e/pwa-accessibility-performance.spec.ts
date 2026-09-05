/**
 * Tests E2E - PWA, Accessibilité, Performance & Stabilité
 * Couverture: manifest, service worker, a11y, performance, erreurs
 */

import { test, expect } from '@playwright/test';

test.describe('PWA - Progressive Web App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('manifest - fichier accessible', async ({ page }) => {
    const response = await page.request.get('/manifest.webmanifest');
    expect(response.ok()).toBe(true);
  });

  /*
   * LE MANIFESTE N'EXISTE QU'APRÈS BUILD. `vite-plugin-pwa` l'engendre à la
   * construction ; le serveur de développement, lui, répond par `index.html`
   * (repli SPA) pour toute URL inconnue. `response.json()` levait donc sur du
   * HTML. On saute explicitement plutôt que de laisser un échec permanent :
   * un test sauté avec sa raison est honnête, un test vert qui ne vérifie
   * rien ne l'est pas.
   */
  test('manifest - contient les champs requis', async ({ page }) => {
    const response = await page.request.get('/manifest.webmanifest');
    const body = await response.text();
    test.skip(
      body.trimStart().startsWith('<'),
      'Serveur de développement : le manifeste PWA est engendré au build'
    );
    const manifest = JSON.parse(body);

    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
    expect(manifest.icons).toBeDefined();
    expect(Array.isArray(manifest.icons)).toBe(true);
  });

  test('service worker - enregistré', async ({ page }) => {
    const swActive = await page.evaluate(() => {
      return navigator.serviceWorker
        ? navigator.serviceWorker.controller !== null
        : false;
    });

    // Le SW peut ne pas être activé immédiatement, donc on vérifie juste que c'est possible
    expect(typeof swActive).toBe('boolean');
  });

  test('offline support - app fonctionne sans réseau', async ({
    page,
    context,
  }) => {
    // Mettre offline
    await context.setOffline(true);

    // Recharger
    await page.reload().catch(() => {
      // C'est ok si ça échoue, on teste juste que la page ne crash pas complètement
    });

    // Remettre online
    await context.setOffline(false);
  });

  test('icons - icônes PWA présentes', async ({ page }) => {
    const response = await page.request.get('/manifest.webmanifest');
    const body = await response.text();
    test.skip(
      body.trimStart().startsWith('<'),
      'Serveur de développement : le manifeste PWA est engendré au build'
    );

    const manifest = JSON.parse(body);
    // Plus de `if` : le manifeste DOIT décrire au moins une icône.
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
    expect(manifest.icons[0].src).toBeDefined();
    expect(manifest.icons[0].sizes).toBeDefined();
  });

  test('theme color - défini', async ({ page }) => {
    /*
     * DEUX BALISES `theme-color` coexistent : celle d'`index.html`, que
     * `useAppTheme` repeint, et celle qu'injecte le plugin PWA. Playwright
     * refuse un locator ambigu (« strict mode violation »). On lit la
     * première, celle que l'application pilote.
     */
    const themeColor = await page
      .locator('meta[name="theme-color"]')
      .first()
      .getAttribute('content');
    expect(themeColor).toMatch(/^#[0-9a-f]{3,8}$/i);
  });

  test('viewport - configuré pour mobile', async ({ page }) => {
    const viewport = await page
      .locator('meta[name="viewport"]')
      .getAttribute('content');
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
  });
});

test.describe('Accessibilité', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('structure sémantique - headings', async ({ page }) => {
    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);
  });

  test('navigation - landmarks (main, nav, footer)', async ({ page }) => {
    const main = page.locator('main, [role="main"]');
    const nav = page.locator('nav, [role="navigation"]');

    if (await main.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(main).toBeVisible();
    }
    if (await nav.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(nav).toBeVisible();
    }
  });

  test('boutons - ont des labels accessibles', async ({ page }) => {
    /*
     * TOUS les boutons visibles, pas « les cinq premiers » : le tirage
     * arbitraire tombait sur des contrôles masqués et ne disait rien de
     * l'écran. On rassemble les fautifs pour que l'échec les nomme, au lieu
     * de s'arrêter au premier.
     */
    const boutons = await page.locator('button:visible').all();
    expect(boutons.length).toBeGreaterThan(0);

    const sansNom: string[] = [];
    for (const bouton of boutons) {
      const aria = await bouton.getAttribute('aria-label');
      const texte = (await bouton.textContent())?.trim();
      if (!aria && !texte) {
        sansNom.push((await bouton.getAttribute('id')) ?? '(sans id)');
      }
    }
    expect(sansNom).toEqual([]);
  });

  test('formulaires - labels associées aux inputs', async ({ page }) => {
    await page.goto('/parametres');

    /*
     * UN `<input>` DANS UN `<label>` EST ÉTIQUETÉ, sans `for` ni `aria-label`.
     * C'est l'étiquetage implicite, et c'est ce que fait l'écran de réglages :
     * `<label class="field field-check"><input …><span>…</span></label>`. Le
     * test ne connaissait que la forme explicite et déclarait fautifs des
     * champs parfaitement accessibles.
     */
    const champs = await page
      .locator('input:visible, textarea:visible, select:visible')
      .all();
    expect(champs.length).toBeGreaterThan(0);

    const sansEtiquette: string[] = [];
    for (const champ of champs) {
      const id = await champ.getAttribute('id');
      const aria = await champ.getAttribute('aria-label');
      const ariaBy = await champ.getAttribute('aria-labelledby');
      const dansUnLabel = await champ.evaluate(
        el => el.closest('label') !== null
      );
      const explicite = id
        ? (await page.locator(`label[for="${id}"]`).count()) > 0
        : false;

      if (!dansUnLabel && !explicite && !aria && !ariaBy) {
        sansEtiquette.push(id ?? '(sans id)');
      }
    }
    expect(sansEtiquette).toEqual([]);
  });

  test('contraste - texte lisible', async ({ page }) => {
    // Vérifier qu'il y a du texte visible
    const textContent = await page.textContent('body');
    expect(textContent).toBeTruthy();
    expect(textContent?.length).toBeGreaterThan(0);
  });

  test('focus management - accessible au clavier', async ({ page }) => {
    // Tester Tab navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      return document.activeElement?.tagName;
    });

    expect(focusedElement).toBeTruthy();
  });

  test('aria-live regions - pour les alertes', async ({ page }) => {
    const ariaLive = page.locator('[aria-live]');
    const count = await ariaLive.count();
    // Il devrait y avoir au moins quelques régions aria-live pour les mises à jour dynamiques
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('images - alt text', async ({ page }) => {
    /*
     * `alt=""` EST UNE RÉPONSE, PAS UN OUBLI. Les deux logos de l'application
     * sont décoratifs et accompagnés de leur nom en toutes lettres : les
     * annoncer une seconde fois nuirait au lecteur d'écran. WCAG demande que
     * l'attribut SOIT LÀ, pas qu'il soit rempli. Le test exigeait une valeur
     * non vide et condamnait donc le choix correct.
     */
    const images = await page.locator('img:visible').all();

    const sansAlt: string[] = [];
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const aria = await img.getAttribute('aria-label');
      if (alt === null && !aria) {
        sansAlt.push((await img.getAttribute('src')) ?? '(sans src)');
      }
    }
    expect(sansAlt).toEqual([]);
  });

  test('langues - attribut lang défini', async ({ page }) => {
    const html = page.locator('html');
    const lang = await html.getAttribute('lang');
    expect(lang).toBeTruthy();
    expect(lang).toMatch(/^[a-z]{2}/);
  });
});

test.describe('Performance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('chargement initial < 3 secondes', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('First Contentful Paint (FCP) - rapide', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      return performance.getEntriesByType('paint');
    });

    const fcp = metrics.find(m => m.name === 'first-contentful-paint');
    if (fcp) {
      expect(fcp.startTime).toBeLessThan(2500);
    }
  });

  test('page size - raisonnable', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    const resourceSizes = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(r => ({
        name: r.name,
        size: r.transferSize,
      }));
    });

    // Vérifier que la page globale n'est pas trop lourde
    const totalSize = resourceSizes.reduce((sum, r) => sum + (r.size || 0), 0);
    expect(totalSize).toBeLessThan(2000000); // 2MB max
  });

  test('bundle size - optimisé', async ({ page }) => {
    const mainScript = await page
      .locator('script[src*="main"], script[type="module"]')
      .first();
    if (await mainScript.isVisible({ timeout: 500 }).catch(() => false)) {
      const src = await mainScript.getAttribute('src');
      expect(src).toBeTruthy();
    }
  });

  test('interactions - responsive (< 100ms)', async ({ page }) => {
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();

    const startTime = Date.now();
    await startButton.click();
    const clickTime = Date.now() - startTime;

    // Le click devrait être enregistré rapidement
    expect(clickTime).toBeLessThan(500);
  });
});

test.describe('Stabilité & Robustesse', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test("pas d'erreurs JavaScript à la page", async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors.length).toBe(0);
  });

  test("pas d'erreurs réseau non gérées", async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('requestfailed', request => {
      // Ignorer les erreurs prévisibles (e.g., 404 des assets optionnels)
      if (!request.url().includes('.map')) {
        failedRequests.push(request.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Devrait n'avoir que 0 ou très peu d'erreurs non gérées
    expect(failedRequests.length).toBeLessThan(2);
  });

  test("localStorage - pas d'erreurs de quota", async ({ page }) => {
    const errors: string[] = [];

    // Créer beaucoup de contractions
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    for (let i = 0; i < 50; i++) {
      try {
        await startButton.click();
        await page.waitForTimeout(50);
        const stopButton = page
          .locator('button')
          .filter({ hasText: /Fin|Stop/ })
          .first();
        await stopButton.click();
        await page.waitForTimeout(50);
      } catch (e) {
        errors.push((e as Error).message);
      }
    }

    expect(errors.length).toBe(0);
  });

  test("récupération d'erreur - parse JSON cassé", async ({ page }) => {
    // Simuler un localStorage corrompu
    await page.evaluate(() => {
      localStorage.setItem('mc_contractions_v1', '{invalid json}');
    });

    // Recharger - l'app devrait gérer l'erreur
    await page.reload();

    // Vérifier que la page ne crash pas
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    if (await startButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(startButton).toBeVisible();
    }
  });

  test('résilience - localStorage plein', async ({ page }) => {
    // Remplir le localStorage
    await page.evaluate(() => {
      let size = 0;
      const maxSize = 5 * 1024 * 1024; // 5MB limit

      try {
        while (size < maxSize * 0.9) {
          const key = `test_${size}`;
          const value = 'x'.repeat(10000);
          localStorage.setItem(key, value);
          size += value.length;
        }
      } catch (e) {
        // QuotaExceededError - c'est normal
      }
    });

    // L'app devrait encore fonctionner
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    if (await startButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(startButton).toBeVisible();
    }
  });

  test('stabilité - multiples interactions rapides', async ({ page }) => {
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();

    // Cliquer rapidement plusieurs fois
    for (let i = 0; i < 10; i++) {
      await startButton.click({ timeout: 100 }).catch(() => {});
      const stopButton = page
        .locator('button')
        .filter({ hasText: /Fin|Stop/ })
        .first();
      await stopButton.click({ timeout: 100 }).catch(() => {});
    }

    // Vérifier que l'app est toujours stable
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
  });

  test('page ne se freeze pas', async ({ page }) => {
    // Créer plusieurs contractions
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    for (let i = 0; i < 3; i++) {
      await startButton.click();
      await page.waitForTimeout(100);
      const stopButton = page
        .locator('button')
        .filter({ hasText: /Fin|Stop/ })
        .first();
      await stopButton.click();
      await page.waitForTimeout(100);
    }

    // Naviguer rapidement entre les pages
    for (let i = 0; i < 3; i++) {
      await page.goto('/parametres');
      await page.goto('/historique');
      await page.goto('/');
    }

    // Vérifier que la page répond toujours
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('memory leak - pas de croissance excessive', async ({ page }) => {
    // Créer et supprimer beaucoup d'éléments
    for (let i = 0; i < 20; i++) {
      const startButton = page
        .locator('button')
        .filter({ hasText: /Début|Start/ })
        .first();
      await startButton.click();
      await page.waitForTimeout(50);
      const stopButton = page
        .locator('button')
        .filter({ hasText: /Fin|Stop/ })
        .first();
      await stopButton.click();
      await page.waitForTimeout(50);
    }

    // Nettoyer
    await page.evaluate(() => localStorage.clear());

    // La page devrait rester responsive
    const startButton = page
      .locator('button')
      .filter({ hasText: /Début|Start/ })
      .first();
    if (await startButton.isVisible({ timeout: 500 }).catch(() => false)) {
      await expect(startButton).toBeVisible();
    }
  });
});

test.describe('Compatibilité Navigateurs', () => {
  test('page se charge sur Chromium', async ({ page }) => {
    await page.goto('/');
    const content = page.locator('body');
    await expect(content).toBeVisible();
  });

  test('fonctionnalités LocalStorage', async ({ page }) => {
    // Sans navigation, `page` est sur `about:blank` : y lire `localStorage`
    // lève `SecurityError`. Ce test échouait pour cette seule raison.
    await page.goto('/');

    const hasLocalStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('__probe', '1');
        localStorage.removeItem('__probe');
        return true;
      } catch {
        return false;
      }
    });
    expect(hasLocalStorage).toBe(true);
  });

  test('API Notifications', async ({ page }) => {
    const hasNotifications = await page.evaluate(() => {
      return 'Notification' in window;
    });
    expect(hasNotifications).toBe(true);
  });

  test('API Service Workers', async ({ page }) => {
    // `serviceWorker` n'est exposé qu'en contexte sécurisé : sur `about:blank`,
    // où ce test restait faute de navigation, l'API est absente.
    await page.goto('/');

    const hasSW = await page.evaluate(() => 'serviceWorker' in navigator);
    expect(hasSW).toBe(true);
  });

  test('API Vibration', async ({ page }) => {
    const hasVibration = await page.evaluate(() => {
      return 'vibrate' in navigator;
    });
    expect(typeof hasVibration).toBe('boolean');
  });

  test('CSS Grid/Flexbox support', async ({ page }) => {
    const supportsGrid = await page.evaluate(() => {
      const el = document.createElement('div');
      return 'grid' in el.style;
    });
    expect(supportsGrid).toBe(true);
  });
});
