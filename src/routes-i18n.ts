/**
 * Multilingual route paths configuration
 * Defines route paths for each supported language
 */

import type { AppLanguage, AppRoute } from './i18n';

/**
 * Route paths for each language
 * Example: { fr: { home: '/', settings: '/parametres' }, en: { home: '/', settings: '/settings' } }
 */
export const routePathsByLanguage: Record<AppLanguage, Record<AppRoute, string>> = {
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
  return routePathsByLanguage[language]?.[route] ?? routePathsByLanguage.en[route] ?? '/';
}

/**
 * Get all possible paths for a route (across all languages)
 * Useful for React Router configuration
 * @param route - Route name
 * @returns Array of all paths for this route in all languages
 */
export function getAllRoutePathsForRoute(route: AppRoute): string[] {
  const paths = new Set<string>();
  Object.values(routePathsByLanguage).forEach(langRoutes => {
    paths.add(langRoutes[route]);
  });
  return Array.from(paths);
}

/**
 * Reverse map: find route name from a path and language
 * Used for parsing current location
 */
export function getRouteFromPath(path: string, language: AppLanguage): AppRoute {
  const routes = routePathsByLanguage[language];
  for (const [route, routePath] of Object.entries(routes)) {
    if (routePath === path) {
      return route as AppRoute;
    }
  }
  return 'home';
}

/**
 * Create redirect map for backward compatibility
 * Maps all old hardcoded paths to canonical route names
 */
export const legacyPathMap: Record<string, AppRoute> = {
  // French paths (canonical)
  '/': 'home',
  '/parametres': 'settings',
  '/historique': 'table',
  '/sage-femme': 'midwife',
  '/maternite': 'maternity',
  '/message': 'message',
  '/valise': 'checklist',
  '/a-propos': 'about',
  // English alternative paths
  '/settings': 'settings',
  '/history': 'table',
  '/midwife': 'midwife',
  '/maternity': 'maternity',
  '/messages': 'message',
  '/sms': 'message',
  '/checklist': 'checklist',
  '/about': 'about',
  // Other variations
  '/tableau': 'table',
  '/table': 'table',
  '/sagefemme': 'midwife',
};
