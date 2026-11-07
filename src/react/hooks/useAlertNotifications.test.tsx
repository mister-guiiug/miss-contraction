import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import type { ContractionRecord } from '../../storage';
import { useAppStore } from '../store/useAppStore';
import { useAlertNotifications } from './useAlertNotifications';

/**
 * Le crochet, avec un navigateur simulé : permission accordée et service
 * worker actif. On observe ce qui atteint `registration.showNotification`.
 */

const BASE_SETTINGS = useAppStore.getState().settings;
const MIN = 60_000;

/** `n` contractions d'une minute, à quatre minutes d'écart : sous le seuil. */
function rythme(n: number, now = Date.now()): ContractionRecord[] {
  return Array.from({ length: n }, (_, i) => {
    const start = now - (n - i) * 4 * MIN;
    return { id: `r${i}`, start, end: start + MIN };
  });
}

/**
 * Laisse à une notification fautive le temps d'arriver : l'affichage attend
 * l'enregistrement du worker, quelques tours de boucle plus loin. Sans ce
 * délai, les tests négatifs passeraient avant qu'elle ait pu partir.
 */
async function laisserPasser() {
  await act(() => new Promise(resolve => setTimeout(resolve, 20)));
}

function Sonde() {
  useAlertNotifications();
  return null;
}

let showNotification: ReturnType<typeof vi.fn>;
const originalServiceWorker = Object.getOwnPropertyDescriptor(
  navigator,
  'serviceWorker'
);

beforeEach(() => {
  localStorage.clear();
  showNotification = vi.fn(() => Promise.resolve());
  const registration = { showNotification };
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      getRegistration: () => Promise.resolve(registration),
      ready: Promise.resolve(registration),
    },
  });
  vi.stubGlobal(
    'Notification',
    Object.assign(function () {}, { permission: 'granted' })
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  if (originalServiceWorker) {
    Object.defineProperty(navigator, 'serviceWorker', originalServiceWorker);
  } else {
    delete (navigator as { serviceWorker?: unknown }).serviceWorker;
  }
  useAppStore.setState({ records: [], settings: BASE_SETTINGS });
});

function monter(records: ContractionRecord[], enabled = true) {
  useAppStore.setState({
    records,
    settings: {
      ...BASE_SETTINGS,
      language: 'fr',
      notificationsEnabled: enabled,
      preAlertEnabled: true,
    },
  });
  render(<Sonde />);
}

describe('useAlertNotifications', () => {
  it('notifie quand une contraction fait franchir le seuil', async () => {
    const records = rythme(3);
    monter(records.slice(0, 2));

    act(() => {
      useAppStore.setState({ records });
    });

    await waitFor(() => expect(showNotification).toHaveBeenCalledOnce());
    expect(showNotification).toHaveBeenCalledWith(
      'Seuil d’alerte atteint',
      expect.objectContaining({ tag: 'mc-threshold', requireInteraction: true })
    );
  });

  it('ne notifie pas au montage un seuil déjà atteint', async () => {
    monter(rythme(3));
    await laisserPasser();
    expect(showNotification).not.toHaveBeenCalled();
  });

  it('ne renotifie pas le même verdict recalculé', async () => {
    const records = rythme(3);
    monter(records.slice(0, 2));
    act(() => {
      useAppStore.setState({ records });
    });
    await waitFor(() => expect(showNotification).toHaveBeenCalledOnce());

    // Une note ajoutée change les enregistrements, pas le verdict.
    act(() => {
      useAppStore.setState({
        records: records.map((r, i) => (i === 0 ? { ...r, note: 'x' } : r)),
      });
    });
    await laisserPasser();
    expect(showNotification).toHaveBeenCalledOnce();
  });

  it('notifie la pré-alerte quand le rythme se resserre', async () => {
    const records = rythme(2);
    monter(records.slice(0, 1));

    act(() => {
      useAppStore.setState({ records });
    });

    await waitFor(() =>
      expect(showNotification).toHaveBeenCalledWith(
        'Rythme soutenu',
        expect.objectContaining({ tag: 'mc-prealert' })
      )
    );
  });

  it('ne notifie rien quand la case est décochée', async () => {
    const records = rythme(3);
    monter(records.slice(0, 2), false);

    act(() => {
      useAppStore.setState({ records });
    });

    await laisserPasser();
    expect(showNotification).not.toHaveBeenCalled();
  });
});
