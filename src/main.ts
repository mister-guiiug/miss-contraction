import "./styles.css";
import { applyResolvedTheme, wireSystemThemeListener } from "./theme";
import { registerServiceWorker } from "./register-sw";
import { mountApp } from "./ui";
import { initWebVitals } from "./monitoring/web-vitals";

applyResolvedTheme();
wireSystemThemeListener();
registerServiceWorker();

// Initialiser le monitoring des Web Vitals
initWebVitals();

mountApp(document.querySelector<HTMLDivElement>("#app")!);
