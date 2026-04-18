/**
 * Application React - Migration progressive
 * Coexiste avec l'application vanilla existante
 */

import { StrictMode, useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { SettingsView } from './views/SettingsView';
import { MaternityView } from './views/MaternityView';
import { registerReactRoute } from './reactRoutes';

// Enregistrer les routes React gérées
registerReactRoute('settings');
registerReactRoute('maternity');

/**
 * Parse la route actuelle depuis le hash (compatible avec le routeur vanilla)
 */
function parseRouteFromHash(): string {
  const hash = window.location.hash.replace(/^#/, '') || '';
  const path = hash.startsWith('/') ? hash : `/${hash}`;

  const routeMap: Record<string, string> = {
    '/parametres': 'settings',
    '/settings': 'settings',
    '/historique': 'table',
    '/table': 'table',
    '/tableau': 'table',
    '/sagefemme': 'midwife',
    '/sage-femme': 'midwife',
    '/midwife': 'midwife',
    '/maternite': 'maternity',
    '/maternity': 'maternity',
    '/message': 'message',
  };

  return routeMap[path] || 'home';
}

/**
 * Composant qui rend le contenu React via Portal dans les conteneurs vanilla
 */
function ReactViewRenderer() {
  const [, setForceUpdate] = useState({});

  // Forcer le re-render quand le hash change
  const onHashChange = useCallback(() => {
    setForceUpdate({});
  }, []);

  useEffect(() => {
    window.addEventListener('hashchange', onHashChange);
    // Également écouter les pushState/popstate (si utilisé par vanilla)
    window.addEventListener('popstate', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, [onHashChange]);

  const currentRoute = parseRouteFromHash();

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
  return <ReactViewRenderer />;
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
