export type AppRoute = "home" | "settings" | "message" | "table" | "maternity" | "midwife";

/**
 * Registre des routes : ajouter ici pour étendre la navigation.
 */
export const ROUTE_META: Record<AppRoute, { documentTitle: string; breadcrumb: string }> = {
  home: { documentTitle: "Miss Contraction", breadcrumb: "Accueil" },
  settings: { documentTitle: "Paramètres — Miss Contraction", breadcrumb: "Paramètres" },
  message: {
    documentTitle: "Message maternité — Miss Contraction",
    breadcrumb: "Message maternité",
  },
  table: {
    documentTitle: "Tableau des contractions — Miss Contraction",
    breadcrumb: "Tableau des contractions",
  },
  maternity: { documentTitle: "Maternité — Miss Contraction", breadcrumb: "Maternité" },
  midwife: {
    documentTitle: "Résumé sage-femme — Miss Contraction",
    breadcrumb: "Résumé sage-femme",
  },
};

export function getDocumentTitle(route: AppRoute): string {
  return ROUTE_META[route].documentTitle;
}

export function getBreadcrumbLabel(route: AppRoute): string {
  return ROUTE_META[route].breadcrumb;
}

export function parseRoute(): AppRoute {
  const path = window.location.hash.replace(/^#/, "") || "/";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/parametres" || normalized === "/settings") return "settings";
  if (normalized === "/message" || normalized === "/messages" || normalized === "/sms")
    return "message";
  if (normalized === "/historique" || normalized === "/tableau" || normalized === "/table")
    return "table";
  if (normalized === "/maternite" || normalized === "/maternity") return "maternity";
  if (normalized === "/sage-femme" || normalized === "/resume" || normalized === "/midwife")
    return "midwife";
  return "home";
}

export function hrefForRoute(route: AppRoute): string {
  const hashes: Record<AppRoute, string> = {
    home: "#/",
    settings: "#/parametres",
    message: "#/message",
    table: "#/historique",
    maternity: "#/maternite",
    midwife: "#/sage-femme",
  };
  return hashes[route];
}

/**
 * Démarre l'écoute des changements de route.
 * @returns Fonction de nettoyage (removeEventListener).
 */
export function startRouter(onChange: () => void): () => void {
  const handler = () => onChange();
  window.addEventListener("hashchange", handler);
  return () => window.removeEventListener("hashchange", handler);
}
