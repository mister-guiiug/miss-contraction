/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

/**
 * Le gestionnaire de `public/notification-click-sw.js`, joué hors navigateur.
 *
 * Le fichier est un script classique chargé par `importScripts` dans le
 * worker : on l'évalue avec un `self` simulé, et l'on déclenche l'événement
 * qu'il écoute.
 */

const SCOPE = 'https://mister-guiiug.github.io/miss-contraction/';
const SOURCE = readFileSync(
  resolve(process.cwd(), 'public/notification-click-sw.js'),
  'utf8'
);

type Listener = (event: unknown) => void;

function load(windows: Array<{ url: string }>) {
  const listeners = new Map<string, Listener>();
  const clients = windows.map(w => ({ ...w, focus: vi.fn() }));
  const self = {
    registration: { scope: SCOPE },
    clients: {
      matchAll: vi.fn(() => Promise.resolve(clients)),
      openWindow: vi.fn(() => Promise.resolve(null)),
    },
    addEventListener: (type: string, listener: Listener) => {
      listeners.set(type, listener);
    },
  };
  new Function('self', SOURCE)(self);
  return { self, clients, click: listeners.get('notificationclick')! };
}

async function touch(click: Listener) {
  const close = vi.fn();
  let pending: Promise<unknown> = Promise.resolve();
  click({
    notification: { close },
    waitUntil: (p: Promise<unknown>) => {
      pending = p;
    },
  });
  await pending;
  return close;
}

describe('notification-click-sw.js', () => {
  it('ramène à la fenêtre de l’application et ferme la notification', async () => {
    const { clients, self, click } = load([{ url: `${SCOPE}#/parametres` }]);
    const close = await touch(click);
    expect(close).toHaveBeenCalledOnce();
    expect(clients[0]!.focus).toHaveBeenCalledOnce();
    expect(self.clients.openWindow).not.toHaveBeenCalled();
  });

  it('ignore les fenêtres des autres applications de la même origine', async () => {
    const { clients, self, click } = load([
      { url: 'https://mister-guiiug.github.io/miss-badminton/' },
      { url: `${SCOPE}` },
    ]);
    await touch(click);
    expect(clients[0]!.focus).not.toHaveBeenCalled();
    expect(clients[1]!.focus).toHaveBeenCalledOnce();
    expect(self.clients.openWindow).not.toHaveBeenCalled();
  });

  it('ouvre l’application quand aucune de ses fenêtres n’est ouverte', async () => {
    const { clients, self, click } = load([
      { url: 'https://mister-guiiug.github.io/miss-badminton/' },
    ]);
    await touch(click);
    expect(clients[0]!.focus).not.toHaveBeenCalled();
    expect(self.clients.openWindow).toHaveBeenCalledWith(SCOPE);
  });
});
