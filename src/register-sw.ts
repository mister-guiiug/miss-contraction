import { registerSW } from 'virtual:pwa-register';

const UPDATE_BANNER_ID = 'sw-update-banner';

let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | undefined;
let isAutoUpdating = false;

/** Force the waiting Service Worker to activate and reload. */
export function forceSwUpdate(): void {
  updateSWFn?.(true);
}

function showUpdateBanner(): void {
  if (document.getElementById(UPDATE_BANNER_ID)) return;

  const bar = document.createElement('div');
  bar.id = UPDATE_BANNER_ID;
  bar.className = 'sw-update-banner';
  bar.setAttribute('role', 'status');
  bar.innerHTML = `
    <p class="sw-update-banner__text">Une nouvelle version de l'application est disponible.</p>
    <button type="button" class="sw-update-banner__btn">Mettre à jour</button>
  `;
  document.body.appendChild(bar);

  bar
    .querySelector<HTMLButtonElement>('.sw-update-banner__btn')
    ?.addEventListener('click', () => {
      updateSWFn?.(true);
    });
}

export function registerServiceWorker(): void {
  if (import.meta.env.DEV) {
    // Avoid stale cached assets during local development.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
          });
        })
        .catch(() => {
          // Ignore unregister errors in development.
        });
    }
    return;
  }

  updateSWFn = registerSW({
    onNeedRefresh() {
      if (isAutoUpdating) return;

      // Try to activate the new Service Worker immediately.
      isAutoUpdating = true;
      updateSWFn
        ?.call(undefined, true)
        .catch(() => {
          // Fallback: keep the manual update banner available.
          showUpdateBanner();
        })
        .finally(() => {
          isAutoUpdating = false;
        });
    },
    onOfflineReady() {},
  });
}
