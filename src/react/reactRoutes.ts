/**
 * Routes gérées par React (migration progressive)
 * Ces routes sont masquées dans l'application vanilla
 */

const REACT_ROUTES = new Set(['settings', 'maternity', 'message', 'table']);

/**
 * Vérifie si une route est gérée par React
 */
export function isReactRoute(route: string): boolean {
  return REACT_ROUTES.has(route);
}

/**
 * Ajoute une route à la liste des routes React
 */
export function registerReactRoute(route: string): void {
  REACT_ROUTES.add(route);
}
