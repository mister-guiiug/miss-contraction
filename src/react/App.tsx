/**
 * Application React - Migration progressive
 * Coexiste avec l'application vanilla existante
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { SettingsView } from './views/SettingsView';
import { MaternityView } from './views/MaternityView';
import { registerReactRoute } from './reactRoutes';

// Enregistrer les routes React gérées
registerReactRoute('settings');
registerReactRoute('maternity');

/**
 * Composant qui rend le contenu React via Portal dans les conteneurs vanilla
 */
function ReactViewRenderer() {
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

  // Récupérer les conteneurs vanilla
  const settingsContainer = document.getElementById('view-settings');
  const maternityContainer = document.getElementById('view-maternity');

  // Afficher les vues React via Portal
  if (currentRoute === 'settings' && settingsContainer) {
    return createPortal(<SettingsView />, settingsContainer);
  }

  if (currentRoute === 'maternity' && maternityContainer) {
    return createPortal(<MaternityView />, maternityContainer);
  }

  // Pour les autres routes, on retourne null
  return null;
}

/**
 * Composant principal de l'application React
 */
function ReactApp() {
  return (
    <HashRouter>
      <ReactViewRenderer />
    </HashRouter>
  );
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
      <ReactApp />
    </StrictMode>
  );
}
