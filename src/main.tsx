import './tailwind.css';
import './styles.css';
import './enhanced-styles.css';
import './enhanced-ui.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from '@mister-guiiug/dev-pwa-config/react';
import {
  installErrorReporter,
  initSentry,
  recordError,
} from '@mister-guiiug/dev-pwa-config/react/observability';
import { initWebVitals } from '@mister-guiiug/dev-pwa-config/web-vitals';
import { unregisterServiceWorkers } from '@mister-guiiug/dev-pwa-config/sw-update';
import { registerSW } from 'virtual:pwa-register';
import { AppUpdates } from '@mister-guiiug/dev-pwa-config/react/app-updates';
import { App } from './react/AppRouter';

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
// EN PRODUCTION, l'enregistrement est confié à `<AppUpdates>` (ci-dessous) :
// le plugin est en `registerType: 'prompt'` (`vite.config.ts`), la nouvelle
// version est téléchargée en fond et c'est l'utilisatrice qui recharge, depuis
// le bandeau du socle. Avant le 02/09/2026, l'app était en `autoUpdate` : un
// déploiement tombant pendant un chronométrage rechargeait la page de lui-même.
if (import.meta.env.DEV) {
  void unregisterServiceWorkers();
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
        {/* En développement, `registerSW` vaut `undefined` : aucun worker n'est
            enregistré et le bandeau ne peut pas apparaître. */}
        <AppUpdates registerSW={import.meta.env.PROD ? registerSW : undefined}>
          <App />
        </AppUpdates>
      </ErrorBoundary>
    </StrictMode>
  );
}
