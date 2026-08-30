import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { useAppStore } from '../../store/useAppStore';
import { TimerSectionWithIntensity } from './TimerSectionWithIntensity';

/**
 * Usage du verrou d'écran : *quand* miss-contraction demande à garder l'écran
 * allumé — contraction en cours **et** réglage « garder l'écran allumé »
 * activé. La mécanique du verrou appartient au socle
 * (`@mister-guiiug/dev-wpa-config/react/use-wake-lock`), qui la prouve
 * lui-même depuis dev-wpa-config#90 et #103 : ré-acquisition au retour au
 * premier plan, écouteur débranché au démontage, silence quand l'API manque
 * ou refuse. Rien de tout cela n'a plus à être retesté ici.
 *
 * Ce qui reste est ce que le socle ne peut pas savoir : la condition
 * d'activation propre à cette app.
 */

const release = vi.fn(() => Promise.resolve());
const request = vi.fn(() => Promise.resolve({ released: false, release }));

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
});
