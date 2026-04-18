import './styles.css';
import './enhanced-styles.css';
import { applyResolvedTheme, wireSystemThemeListener } from './theme';
import { registerServiceWorker } from './register-sw';
import { mountApp } from './ui';
import { initWebVitals } from './monitoring/web-vitals';
import { mountReactApp } from './react/App';

applyResolvedTheme();
wireSystemThemeListener();
registerServiceWorker();

// Initialiser le monitoring des Web Vitals
initWebVitals();

// Initialiser l'application vanilla
mountApp(document.querySelector<HTMLDivElement>('#app')!);

// Initialiser l'application React (coexistence)
mountReactApp();
