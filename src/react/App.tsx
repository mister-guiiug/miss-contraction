/**
 * Application React - Migration progressive
 * Coexiste avec l'application vanilla existante
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, useLocation } from 'react-router-dom';
import { SettingsView } from './views/SettingsView';
import { MaternityView } from './views/MaternityView';

/**
 * Composant principal de l'application React
 */
function ReactApp() {
  const location = useLocation();
  const route = location.pathname.replace(/^\//, '') || 'home';

  // Mapping des routes vanilla vers React
  const routeMap: Record<string, string> = {
    parametres: 'settings',
    settings: 'settings',
    historique: 'table',
    table: 'table',
    sagefemme: 'midwife',
    'sage-femme': 'midwife',
    maternite: 'maternity',
    maternity: 'maternity',
    message: 'message',
  };

  const currentRoute = routeMap[route] || 'home';

  // Afficher les vues React
  // Les autres routes restent en vanilla
  if (currentRoute === 'settings') {
    return <SettingsView />;
  }

  if (currentRoute === 'maternity') {
    return <MaternityView />;
  }

  // Pour les autres routes, on retourne null
  // L'application vanilla gère l'affichage
  return null;
}

/**
 * Point d'entrée React
 */
export function mountReactApp(): void {
  const rootElement = document.getElementById('react-root');
  if (!rootElement) return;

  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <HashRouter>
        <ReactApp />
      </HashRouter>
    </StrictMode>
  );
}
