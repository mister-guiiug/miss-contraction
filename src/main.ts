import "./styles.css";
import { applyResolvedTheme, wireSystemThemeListener } from "./theme";
import { registerServiceWorker } from "./register-sw";
import { mountApp } from "./ui";

applyResolvedTheme();
wireSystemThemeListener();
registerServiceWorker();

mountApp(document.querySelector<HTMLDivElement>("#app")!);
