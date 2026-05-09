import './tailwind.css';
import './styles.css';
import './enhanced-styles.css';
import './enhanced-ui.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyResolvedTheme, wireSystemThemeListener } from './theme';
import { registerServiceWorker } from './register-sw';
import { initWebVitals } from './monitoring/web-vitals';
import { App } from './react/AppRouter';
import i18n from './i18n.config'; // Initialiser i18next
import { detectBrowserLanguage } from './i18n';

applyResolvedTheme();
wireSystemThemeListener();
registerServiceWorker();

// Initialiser le monitoring des Web Vitals
initWebVitals();

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
      <App />
    </StrictMode>
  );
}
