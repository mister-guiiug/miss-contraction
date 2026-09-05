import { defineConfig, devices } from '@playwright/test';
import { definePwaPlaywrightConfig } from '@mister-guiiug/dev-pwa-config/playwright-base';

// La factory fournit la matrice 5 navigateurs, les reporters multi-format,
// le snapshotPathTemplate, reducedMotion et le webServer (cf. dev-pwa-config 1.3.0).
// Port 4173 : ne pas réutiliser par erreur un AUTRE dev server déjà lancé
// sur 5173 (reuseExistingServer est actif hors CI).
const base = definePwaPlaywrightConfig({
  devices,
  testMatch: /.*\.spec\.ts$/,
  port: 4173,
  command: 'npm run dev -- --port 4173 --strictPort',
});

/**
 * ── LA LOCALE EST FIXÉE, ET CE N'EST PAS UN DÉTAIL ────────────────────────────
 *
 * L'application choisit sa langue avec `detectBrowserLanguage()`, qui lit
 * `navigator.language`. Sans `locale` ici, celle-ci vaut ce que veut la machine
 * qui lance les tests : `en-US` sur un poste anglophone, `fr-FR` ailleurs. Or
 * la suite est écrite en français — elle cherche « Fin », « Enregistré »,
 * « Supprimer ».
 *
 * Le résultat était une suite dont le verdict dépendait du poste. Sur une
 * machine anglophone, `page.locator('button').filter({ hasText: /Fin|Stop/ })`
 * ne trouvait rien : le bouton affiche « End contraction ». Ces `beforeEach`
 * partaient alors en timeout de 30 secondes, et emportaient tous les tests du
 * fichier. Ce n'est pas l'application qui changeait de langue en cours de
 * route, c'est le test qui n'avait jamais parlé la bonne.
 *
 * `fr-FR` plutôt que `en-US` : les specs, les données de test et les chemins
 * de route (`/parametres`, `/historique`) sont français. Les descripteurs
 * `devices` de Playwright ne posent pas de `locale`, cette valeur s'applique
 * donc à tous les projets.
 *
 * Le fuseau suit la même logique : plusieurs tests comparent des heures
 * affichées, et les laisser dépendre du poste revient à tirer à pile ou face.
 */
export default defineConfig({
  ...base,

  /*
   * ── À SIGNALER AU SOCLE : LE GABARIT DE CAPTURE PERD `{arg}` ────────────────
   *
   * `dev-pwa-config` pose
   *   '{snapshotDir}/{testFileDir}/{testFileName}-{projectName}-{platform}{ext}'
   *
   * Il n'y a PAS de `{arg}` — le nom de la capture. Les soixante captures d'un
   * même fichier de test s'écrivent donc toutes dans LE MÊME PNG : chaque test
   * écrase la référence du précédent, puis se compare à celle laissée par un
   * autre. On obtenait des différences de 4 à 9 %, parfaitement reproductibles,
   * où l'image de comparaison superposait deux écrans sans rapport — les
   * réglages contre l'accueil.
   *
   * Cinquante-huit tests visuels sur soixante échouaient pour cette seule
   * raison. Le défaut est dans le socle et touche toute la famille ; on le
   * corrige ici en attendant, sans rien changer d'autre au gabarit.
   */
  snapshotPathTemplate:
    '{snapshotDir}/{testFileDir}/{arg}-{projectName}-{platform}{ext}',

  use: {
    // La factory type `use` de façon lâche : on l'étale explicitement plutôt
    // que de laisser `tsc` refuser un spread sur un type non-objet.
    ...(base.use ?? {}),
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },
});
