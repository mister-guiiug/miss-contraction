import "./styles.css";
import { registerSW } from "virtual:pwa-register";
import { applyResolvedTheme, wireSystemThemeListener } from "./theme";
import { mountApp } from "./ui";

applyResolvedTheme();
wireSystemThemeListener();
registerSW({ immediate: true });

mountApp(document.querySelector<HTMLDivElement>("#app")!);
