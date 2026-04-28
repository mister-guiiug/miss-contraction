import './styles.css';
import './enhanced-styles.css';
import './enhanced-ui.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyResolvedTheme, wireSystemThemeListener } from './theme';
import { registerServiceWorker } from './register-sw';
import { initWebVitals } from './monitoring/web-vitals';
import { App } from './react/AppRouter';

applyResolvedTheme();
wireSystemThemeListener();
registerServiceWorker();

// Initialiser le monitoring des Web Vitals
initWebVitals();

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
