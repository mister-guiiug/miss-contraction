/**
 * Métadonnées et types pour les routes de l'application
 */

export type AppRoute =
  | 'home'
  | 'settings'
  | 'message'
  | 'table'
  | 'maternity'
  | 'midwife';

/**
 * Registre des routes : ajouter ici pour étendre la navigation.
 */
export const ROUTE_META: Record<
  AppRoute,
  { documentTitle: string; breadcrumb: string }
> = {
  home: { documentTitle: 'Miss Contraction', breadcrumb: 'Accueil' },
  settings: {
    documentTitle: 'Paramètres — Miss Contraction',
    breadcrumb: 'Paramètres',
  },
  message: {
    documentTitle: 'Message maternité — Miss Contraction',
    breadcrumb: 'Message maternité',
  },
  table: {
    documentTitle: 'Tableau des contractions — Miss Contraction',
    breadcrumb: 'Tableau des contractions',
  },
  maternity: {
    documentTitle: 'Maternité — Miss Contraction',
    breadcrumb: 'Maternité',
  },
  midwife: {
    documentTitle: 'Résumé sage-femme — Miss Contraction',
    breadcrumb: 'Résumé sage-femme',
  },
};

export function getDocumentTitle(route: AppRoute): string {
  return ROUTE_META[route].documentTitle;
}

export function getBreadcrumbLabel(route: AppRoute): string {
  return ROUTE_META[route].breadcrumb;
}
