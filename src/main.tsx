import './tailwind.css';
import './styles.css';
import './enhanced-styles.css';
import './enhanced-ui.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '@mister-guiiug/dev-wpa-config/react';
import {
  installErrorReporter,
  initSentry,
  recordError,
} from '@mister-guiiug/dev-wpa-config/react/observability';
import { initWebVitals } from '@mister-guiiug/dev-wpa-config/web-vitals';
import { unregisterServiceWorkers } from '@mister-guiiug/dev-wpa-config/sw-update';
import { registerSW } from 'virtual:pwa-register';
import { App } from './react/AppRouter';
import i18n from './i18n.config'; // Initialiser i18next
import { detectBrowserLanguage } from './i18n';

installErrorReporter();
void initSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  loader: () => import('@sentry/react'),
});

// Service worker. LA GARDE `DEV` RESTE ICI : `unregisterServiceWorkers` est du
// JavaScript ordinaire, aussi consommé par `node --test` côté socle, et ne peut
// pas lire `import.meta.env`. En développement, un worker resté d'une session
// précédente sert du cache périmé et se bat contre le HMR.
//
// EN PRODUCTION, `registerSW()` SUFFIT — et c'est tout ce qu'il faut. Le plugin
// est configuré en `registerType: 'autoUpdate'` (`vite.config.ts`) : le worker
// généré porte `skipWaiting` + `clientsClaim`, et le module `virtual:pwa-register`
// recharge lui-même la page sur l'évènement `activated` d'une mise à jour.
// `onNeedRefresh` n'est JAMAIS appelé dans ce mode (il n'existe que dans la
// branche `prompt`), et `updateSW(true)` y est un no-op : les deux rappels que
// portait `src/register-sw.ts` étaient du code mort.
if (import.meta.env.DEV) {
  void unregisterServiceWorkers();
} else {
  registerSW();
}

// Web Vitals via le socle (INP au lieu de FID, métriques indépendantes) :
// log en dev, relai vers GA4 quand gtag est injecté au build.
void initWebVitals({
  onMetric: metric => {
    if (import.meta.env.DEV) {
      console.log('[Web Vitals]', metric);
    }
    window.gtag?.('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(
        metric.name === 'CLS' ? metric.value * 1000 : metric.value
      ),
      non_interaction: true,
      custom_map: { metric_rating: metric.rating },
    });
  },
});

// Initialiser i18n avec la langue du navigateur / stockée
const savedLanguage = localStorage.getItem('i18nextLng');
const initialLanguage = savedLanguage || detectBrowserLanguage();
i18n.changeLanguage(initialLanguage);

// Initialiser l'application React avec React Router
const rootElement = document.querySelector<HTMLDivElement>('#app');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <ErrorBoundary
        onError={error => {
          recordError(error, { source: 'error-boundary' });
        }}
      >
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}
