/*
 * Toucher une notification d'alerte ramène à l'application.
 *
 * Importé par le worker que Workbox engendre (vite.config.ts →
 * `workbox.importScripts`). Sans ce gestionnaire, une notification affichée
 * par `registration.showNotification` ne fait RIEN quand on la touche : c'est
 * la page qui l'a demandée, mais c'est le worker qui reçoit le geste.
 *
 * LE FILTRE SUR LA PORTÉE N'EST PAS UNE PRÉCAUTION DE STYLE. Toute la famille
 * partage une origine (mister-guiiug.github.io) : `includeUncontrolled` rend
 * aussi les fenêtres des AUTRES applications, et la première venue aurait
 * pris le focus à la place de celle-ci.
 */
/* global self */

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const scope = self.registration.scope;
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      const mine = windows.find(client => client.url.startsWith(scope));
      if (mine) return mine.focus();
      return self.clients.openWindow(scope);
    })()
  );
});
