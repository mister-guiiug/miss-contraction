import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { themeBootSource } from '@mister-guiiug/dev-wpa-config/theme-boot';
import { LS_THEME } from './themeKey';
import { nextThemePreference, useAppTheme } from './theme';

/**
 * CE QUE CE TEST GARDE, après le passage à `react/use-theme` du socle.
 *
 * 1. LA CLÉ. `useTheme` lit `storageKey` d'abord, `legacyKeys` ensuite. En
 *    laissant le défaut (`dwc_theme`), miss-contraction aurait hérité du thème
 *    réglé dans une autre app de la famille — même origine GitHub Pages, même
 *    `localStorage` — et l'écran aurait changé de couleur au premier
 *    chargement. On passe donc `mc_theme` explicitement. Le test échoue si
 *    quelqu'un retire ce réglage.
 *
 * 2. LE SENS DE `matchMedia`. L'ancien code demandait
 *    `(prefers-color-scheme: light)` avec repli SOMBRE. Sur un navigateur
 *    moderne c'est équivalent — la requête `light` répond vrai aussi quand
 *    aucune préférence n'est exprimée, `no-preference` ayant disparu de la
 *    spécification. Mais partout où `prefers-color-scheme` n'existe pas, la
 *    requête ne répond jamais et l'app tombait en SOMBRE, là où le reste de la
 *    famille (et le propre repli du script anti-FOUC, `'light'`) tombe en
 *    clair. Le socle demande `(prefers-color-scheme: dark)` : le défaut
 *    redevient clair, et l'app cesse de se contredire elle-même.
 *
 * 3. LES DEUX LECTEURS LISENT LA MÊME CHOSE. Le script anti-FOUC est engendré
 *    au build à partir de la même constante que le hook. S'ils divergent, le
 *    scintillement que le script existe pour supprimer revient.
 */

/** `matchMedia` pilotable : `dark` dit si l'appareil demande le sombre. */
function stubMatchMedia(dark: boolean, supported = true) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      // Un navigateur sans `prefers-color-scheme` ne fait correspondre aucune
      // des deux requêtes : c'est le cas qui départageait les deux écritures.
      matches: supported && query.includes('dark') === dark ? dark : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onchange: null,
    }))
  );
}

function Sonde() {
  const { preference, resolved } = useAppTheme();
  return (
    <>
      <span data-testid="preference">{preference}</span>
      <span data-testid="resolved">{resolved}</span>
    </>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('clé de stockage', () => {
  it('reprend la préférence déjà écrite sous `mc_theme`', () => {
    // Ce qu'une utilisatrice installée a dans son navigateur aujourd'hui.
    localStorage.setItem('mc_theme', 'dark');
    stubMatchMedia(false);

    render(<Sonde />);

    expect(screen.getByTestId('preference')).toHaveTextContent('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('ne va PAS chercher la clé partagée de la famille', () => {
    // Le thème réglé dans une autre app de la famille ne doit pas déteindre
    // ici : c'est tout l'intérêt de passer `storageKey`.
    localStorage.setItem('dwc_theme', 'dark');
    localStorage.setItem('mc_theme', 'light');
    stubMatchMedia(true);

    render(<Sonde />);

    expect(screen.getByTestId('preference')).toHaveTextContent('light');
  });

  it('écrit sous `mc_theme`, la clé que lit aussi le script anti-FOUC', () => {
    stubMatchMedia(false);
    render(<Sonde />);

    expect(localStorage.getItem(LS_THEME)).toBe('system');
    expect(themeBootSource({ storageKey: LS_THEME })).toContain(
      JSON.stringify(LS_THEME)
    );
  });
});

describe('résolution du thème système', () => {
  it('suit l’appareil quand il demande le sombre', () => {
    stubMatchMedia(true);
    render(<Sonde />);
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
  });

  it('retombe en CLAIR quand `prefers-color-scheme` n’existe pas', () => {
    // L'ancien `matchMedia('(prefers-color-scheme: light)') ? light : dark`
    // rendait « dark » ici, en contredisant le repli du script anti-FOUC.
    stubMatchMedia(false, false);
    render(<Sonde />);
    expect(screen.getByTestId('resolved')).toHaveTextContent('light');
  });
});

describe('cycle du bouton', () => {
  it('garde les trois temps, que le `toggle()` du socle perdrait', () => {
    expect(nextThemePreference('system')).toBe('light');
    expect(nextThemePreference('light')).toBe('dark');
    expect(nextThemePreference('dark')).toBe('system');
  });
});
