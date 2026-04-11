import { registerSW } from "virtual:pwa-register";

const UPDATE_BANNER_ID = "sw-update-banner";

let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | undefined;

function showUpdateBanner(): void {
  if (document.getElementById(UPDATE_BANNER_ID)) return;

  const bar = document.createElement("div");
  bar.id = UPDATE_BANNER_ID;
  bar.className = "sw-update-banner";
  bar.setAttribute("role", "status");
  bar.innerHTML = `
    <p class="sw-update-banner__text">Une nouvelle version de l'application est disponible.</p>
    <button type="button" class="sw-update-banner__btn">Mettre à jour</button>
  `;
  document.body.appendChild(bar);

  bar.querySelector<HTMLButtonElement>(".sw-update-banner__btn")?.addEventListener("click", () => {
    updateSWFn?.(true);
  });
}

export function registerServiceWorker(): void {
  updateSWFn = registerSW({
    onNeedRefresh() {
      showUpdateBanner();
    },
    onOfflineReady() {},
  });
}
