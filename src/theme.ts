import { useEffect } from 'react';
import {
  useTheme as useSocleTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '@mister-guiiug/dev-wpa-config/react/use-theme';

// Les deux types venaient d'ici et y restent accessibles : `Shell` les importe,
// ils sont désormais ceux du socle.
export type { ResolvedTheme, ThemePreference };

// La clé de stockage vit dans son propre module : le script anti-FOUC, qui
// tourne en contexte Node au build, doit lire la même. Le pourquoi du choix y
// est écrit.
export { LS_THEME } from './themeKey';
import { LS_THEME } from './themeKey';

/** Couleur de la barre du navigateur, par thème résolu. */
const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: '#a0309a',
  dark: '#3d1040',
};

/**
 * L'ordre du bouton : système → clair → sombre → système.
 *
 * `useTheme` expose `toggle()`, mais il ne fait qu'alterner clair/sombre : il
 * perdrait le troisième état, celui qui suit l'appareil. On garde donc le
 * cycle à trois temps de l'app et on le pousse par `setTheme`.
 */
export function nextThemePreference(current: ThemePreference): ThemePreference {
  return current === 'system'
    ? 'light'
    : current === 'light'
      ? 'dark'
      : 'system';
}

/**
 * Le thème de l'app : l'état et l'écriture de `data-theme` viennent du socle,
 * la couleur de la barre du navigateur reste ici.
 *
 * `useTheme` pose `data-theme` et `color-scheme` sur `<html>` et suit
 * `prefers-color-scheme` quand la préférence vaut `system`. Il ne touche pas à
 * `<meta name="theme-color">`, que cette app peint aux couleurs de sa palette
 * depuis toujours ; c'est le seul morceau qui reste local.
 */
export function useAppTheme() {
  const { theme, resolved, setTheme } = useSocleTheme({
    storageKey: LS_THEME,
    defaultTheme: 'system',
    attribute: 'data-theme',
  });

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]'
    );
    meta?.setAttribute('content', THEME_COLOR[resolved]);
  }, [resolved]);

  return {
    preference: theme,
    resolved,
    cycle: () => setTheme(nextThemePreference(theme)),
  };
}
