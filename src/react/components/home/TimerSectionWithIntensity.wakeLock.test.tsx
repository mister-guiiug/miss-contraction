import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { useAppStore } from '../../store/useAppStore';
import { TimerSectionWithIntensity } from './TimerSectionWithIntensity';

/**
 * Usage du verrou d'écran : *quand* miss-contraction demande à garder l'écran
 * allumé — contraction en cours **et** réglage « garder l'écran allumé »
 * activé. La mécanique du verrou appartient au socle
 * (`@mister-guiiug/dev-wpa-config/react/use-wake-lock`).
 *
 * Le dernier cas fait exception et reste ici : la ré-acquisition au retour au
 * premier plan est précisément ce que la copie locale ne faisait PAS (l'écran
 * s'éteignait après un aller-retour dans une autre app en pleine contraction).
 * Tant que le socle n'a pas de test pour son propre hook, c'est la seule
 * preuve du correctif dans le parc.
 */

type Sentinel = { released: boolean; release: () => Promise<void> };

const release = vi.fn(() => Promise.resolve());
let lastSentinel: Sentinel | null = null;
const request = vi.fn(() => {
  lastSentinel = { released: false, release };
  return Promise.resolve(lastSentinel);
});

const BASE_SETTINGS = useAppStore.getState().settings;

function setup(options: { running: boolean; keepAwake: boolean }) {
  useAppStore.setState({
    records: [],
    activeStart: options.running ? Date.now() : null,
    settings: {
      ...BASE_SETTINGS,
      keepAwakeDuringContraction: options.keepAwake,
    },
  });
}

beforeEach(() => {
  release.mockClear();
  request.mockClear();
  lastSentinel = null;
  Object.defineProperty(navigator, 'wakeLock', {
    value: { request },
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, 'wakeLock');
  useAppStore.setState({ records: [], activeStart: null });
});

describe('minuteur de contraction et verrou d’écran', () => {
  it('demande le verrou pendant une contraction', async () => {
    setup({ running: true, keepAwake: true });
    render(<TimerSectionWithIntensity />);
    await vi.waitFor(() => expect(request).toHaveBeenCalledWith('screen'));
  });

  it('ne demande rien hors contraction', () => {
    setup({ running: false, keepAwake: true });
    render(<TimerSectionWithIntensity />);
    expect(request).not.toHaveBeenCalled();
  });

  it('respecte le réglage « garder l’écran allumé » désactivé', () => {
    setup({ running: true, keepAwake: false });
    render(<TimerSectionWithIntensity />);
    expect(request).not.toHaveBeenCalled();
  });

  it('relâche le verrou à la fin de la contraction', async () => {
    setup({ running: true, keepAwake: true });
    const { unmount } = render(<TimerSectionWithIntensity />);
    await vi.waitFor(() => expect(request).toHaveBeenCalled());
    unmount();
    await vi.waitFor(() => expect(release).toHaveBeenCalled());
  });

  it('reprend le verrou au retour de l’app au premier plan', async () => {
    setup({ running: true, keepAwake: true });
    render(<TimerSectionWithIntensity />);
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));

    // Le navigateur relâche silencieusement le verrou en arrière-plan…
    expect(lastSentinel).not.toBeNull();
    lastSentinel!.released = true;
    // …puis l'onglet revient au premier plan.
    document.dispatchEvent(new Event('visibilitychange'));

    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });
});
