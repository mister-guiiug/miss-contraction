import "./styles.css";
import { registerSW } from "virtual:pwa-register";
import { mountApp } from "./ui";

registerSW({ immediate: true });

mountApp(document.querySelector<HTMLDivElement>("#app")!);
