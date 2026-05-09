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

export function getRouteMeta(
  route: AppRoute,
  language: AppLanguage
): {
  documentTitle: string;
  breadcrumb: string;
} {
  const appName = t(language, 'app.name');
  const breadcrumb = t(language, `route.${route}`);
  const documentTitle =
    route === 'home' ? appName : `${breadcrumb} - ${appName}`;
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
