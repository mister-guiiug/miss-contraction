/**
 * Multilingual route paths configuration
 * Defines route paths for each supported language
 */

import type { AppLanguage } from './i18n';
import type { AppRoute } from './routes';

/**
 * Route paths for each language
 * Example: { fr: { home: '/', settings: '/parametres' }, en: { home: '/', settings: '/settings' } }
 */
const routePathsByLanguage: Record<AppLanguage, Record<AppRoute, string>> = {
  fr: {
    home: '/',
    settings: '/parametres',
    table: '/historique',
    midwife: '/sage-femme',
    maternity: '/maternite',
    message: '/message',
    checklist: '/valise',
    about: '/a-propos',
  },
  en: {
    home: '/',
    settings: '/settings',
    table: '/history',
    midwife: '/midwife',
    maternity: '/maternity',
    message: '/messages',
    checklist: '/checklist',
    about: '/about',
  },
  es: {
    home: '/',
    settings: '/configuracion',
    table: '/historial',
    midwife: '/comadrona',
    maternity: '/maternidad',
    message: '/mensaje',
    checklist: '/lista',
    about: '/acerca-de',
  },
  de: {
    home: '/',
    settings: '/einstellungen',
    table: '/verlauf',
    midwife: '/hebamme',
    maternity: '/mutterschaft',
    message: '/nachricht',
    checklist: '/checkliste',
    about: '/uber-uns',
  },
  it: {
    home: '/',
    settings: '/impostazioni',
    table: '/cronologia',
    midwife: '/ostetrica',
    maternity: '/maternita',
    message: '/messaggio',
    checklist: '/checklist',
    about: '/chi-siamo',
  },
  pt: {
    home: '/',
    settings: '/configuracoes',
    table: '/historico',
    midwife: '/parteira',
    maternity: '/maternidade',
    message: '/mensagem',
    checklist: '/lista-de-verificacao',
    about: '/sobre-nos',
  },
  nl: {
    home: '/',
    settings: '/instellingen',
    table: '/geschiedenis',
    midwife: '/vroedvrouw',
    maternity: '/materniteit',
    message: '/bericht',
    checklist: '/checklist',
    about: '/over-ons',
  },
};

/**
 * Get route path for a specific route and language
 * @param route - Route name (e.g., 'settings', 'table', 'about')
 * @param language - Language code (e.g., 'en', 'fr', 'es')
 * @returns The route path for the given language
 */
export function getRoutePath(route: AppRoute, language: AppLanguage): string {
  return (
    routePathsByLanguage[language]?.[route] ??
    routePathsByLanguage.en[route] ??
    '/'
  );
}

/**
 * Reverse map: find route name from a path and language
 * Used for parsing current location
 */
export function getRouteFromPath(
  path: string,
  language: AppLanguage
): AppRoute {
  const routes = routePathsByLanguage[language];
  for (const [route, routePath] of Object.entries(routes)) {
    if (routePath === path) {
      return route as AppRoute;
    }
  }
  return 'home';
}
