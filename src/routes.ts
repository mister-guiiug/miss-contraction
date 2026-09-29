/**
 * Métadonnées et types pour les routes de l'application
 */

import { t, type AppLanguage } from './i18n';

export type AppRoute =
  | 'home'
  | 'settings'
  | 'message'
  | 'table'
  | 'maternity'
  | 'midwife'
  | 'checklist'
  | 'about';

function getRouteMeta(
  route: AppRoute,
  language: AppLanguage
): {
  documentTitle: string;
  breadcrumb: string;
} {
  const appName = t(language, 'app.name');
  const breadcrumb = t(language, `route.${route}`);
  // L'accueil et « À propos », seules pages publiques, gardent un titre long
  // (≥ 50 caractères), celui du HTML servi en français : Google et Bing
  // indexent le titre APRÈS rendu, et classent un titre court comme défaut.
  const documentTitle =
    route === 'home'
      ? t(language, 'app.homeTitle')
      : route === 'about'
        ? t(language, 'app.aboutTitle')
        : `${breadcrumb} - ${appName}`;
  return { documentTitle, breadcrumb };
}

export function getDocumentTitle(
  route: AppRoute,
  language: AppLanguage
): string {
  return getRouteMeta(route, language).documentTitle;
}

export function getBreadcrumbLabel(
  route: AppRoute,
  language: AppLanguage
): string {
  return getRouteMeta(route, language).breadcrumb;
}
