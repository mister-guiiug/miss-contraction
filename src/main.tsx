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
import { applyResolvedTheme, wireSystemThemeListener } from './theme';
import { registerServiceWorker } from './register-sw';
import { App } from './react/AppRouter';
import i18n from './i18n.config'; // Initialiser i18next
import { detectBrowserLanguage } from './i18n';

installErrorReporter();
void initSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  loader: () => import('@sentry/react'),
});
applyResolvedTheme();
wireSystemThemeListener();
registerServiceWorker();

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
