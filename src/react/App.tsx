/**
 * Application React - Migration progressive
 * Coexiste avec l'application vanilla existante
 */

import { StrictMode, useEffect, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { SettingsView } from './views/SettingsView';
import { MaternityView } from './views/MaternityView';
import { MessageView } from './views/MessageView';
import { TableView } from './views/TableView';
import { MidwifeView } from './views/MidwifeView';
import { registerReactRoute } from './reactRoutes';

// Marqueur global pour indiquer que React gère une route
declare global {
  interface Window {
    __REACT_ROUTE__: string | null;
  }
}

// Enregistrer les routes React gérées
registerReactRoute('settings');
registerReactRoute('maternity');
registerReactRoute('message');
registerReactRoute('table');
registerReactRoute('midwife');

/**
 * Hook pour récupérer un élément du DOM de manière sécurisée
 * et vider son contenu pour éviter les doublons vanilla/React
 */
function useElement(id: string): HTMLElement | null {
  const [element, setElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.getElementById(id);
    if (el) {
      // Vider le contenu vanilla pour éviter les doublons
      el.innerHTML = '';
    }
    setElement(el);
  }, [id]);

  return element;
}

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
  const [currentRoute, setCurrentRoute] = useState(parseRouteFromHash);

  // Forcer le re-render quand le hash change
  const onHashChange = useCallback(() => {
    setCurrentRoute(parseRouteFromHash());
  }, []);

  useEffect(() => {
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, [onHashChange]);

  // Récupérer les conteneurs vanilla
  const settingsContainer = useElement('view-settings');
  const maternityContainer = useElement('view-maternity');
  const messageContainer = useElement('view-message');
  const tableContainer = useElement('view-table');
  const midwifeContainer = useElement('view-midwife');

  // Marquer la route React active
  useEffect(() => {
    if (currentRoute === 'settings' || currentRoute === 'maternity' || currentRoute === 'message' || currentRoute === 'table' || currentRoute === 'midwife') {
      window.__REACT_ROUTE__ = currentRoute;
      console.log('🟦 React: Route =', currentRoute);
    } else {
      window.__REACT_ROUTE__ = null;
    }
  }, [currentRoute]);

  // Afficher les vues React via Portal
  if (currentRoute === 'settings' && settingsContainer) {
    return createPortal(<SettingsView />, settingsContainer);
  }

  if (currentRoute === 'maternity' && maternityContainer) {
    return createPortal(<MaternityView />, maternityContainer);
  }

  if (currentRoute === 'message' && messageContainer) {
    return createPortal(<MessageView />, messageContainer);
  }

  if (currentRoute === 'table' && tableContainer) {
    return createPortal(<TableView />, tableContainer);
  }

  if (currentRoute === 'midwife' && midwifeContainer) {
    return createPortal(<MidwifeView />, midwifeContainer);
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
