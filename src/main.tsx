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
import { trackEvent } from '@mister-guiiug/dev-pwa-config/analytics';
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
// EN PRODUCTION, l'enregistrement est confié à `<AppUpdates checkEvery="1h">` (ci-dessous) :
// le plugin est en `registerType: 'prompt'` (`vite.config.ts`), la nouvelle
// version est téléchargée en fond et c'est l'utilisatrice qui recharge, depuis
// le bandeau du socle. Avant le 02/09/2026, l'app était en `autoUpdate` : un
// déploiement tombant pendant un chronométrage rechargeait la page de lui-même.
if (import.meta.env.DEV) {
  void unregisterServiceWorkers();
}

// Web Vitals via le socle (INP au lieu de FID, métriques indépendantes) : log
// en dev, remontée à la mesure d'audience en production.
//
// CE RELAIS PASSAIT PAR `window.gtag?.(…)`, ET IL SERAIT DEVENU MUET. Ce
// global n'existait que parce que `gtag.js` le posait ; PostHog ne pose rien de
// tel, et l'appel optionnel se serait tu SANS ERREUR — un relais toujours
// présent dans le code, ne remontant plus jamais rien. C'est exactement le mode
// de panne que ce parc passe son temps à traquer.
//
// `trackEvent` du socle fait mieux que remplacer : il respecte le consentement
// (il rend `false` et n'envoie rien tant que l'accord n'est pas donné), là où
// `window.gtag` écrivait dans la file dès que le script était là.
void initWebVitals({
  onMetric: metric => {
    if (import.meta.env.DEV) {
      console.log('[Web Vitals]', metric);
    }
    trackEvent(metric.name, {
      categorie: 'web-vitals',
      // La valeur entière : PostHog n'a pas de notion de `value` d'événement,
      // c'est une propriété comme une autre — nommée, donc lisible.
      valeur: Math.round(
        metric.name === 'CLS' ? metric.value * 1000 : metric.value
      ),
      appreciation: metric.rating,
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
        <AppUpdates
          checkEvery="1h"
          registerSW={import.meta.env.PROD ? registerSW : undefined}
        >
          <App />
        </AppUpdates>
      </ErrorBoundary>
    </StrictMode>
  );
}
