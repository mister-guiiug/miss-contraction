const LS_THEME = 'mc_theme';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export function getStoredThemePreference(): ThemePreference {
  const s = localStorage.getItem(LS_THEME);
  if (s === 'light' || s === 'dark' || s === 'system') return s;
  return 'system';
}

export function getResolvedTheme(): ResolvedTheme {
  const pref = getStoredThemePreference();
  if (pref === 'light') return 'light';
  if (pref === 'dark') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

export function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.setAttribute('data-theme', theme);
  const meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]'
  );
  if (meta) {
    meta.setAttribute('content', theme === 'light' ? '#a0309a' : '#3d1040');
  }
}

export function applyResolvedTheme(): void {
  applyTheme(getResolvedTheme());
}

export function persistTheme(pref: ThemePreference): void {
  const t: ThemePreference =
    pref === 'light' || pref === 'dark' || pref === 'system' ? pref : 'system';
  localStorage.setItem(LS_THEME, t);
  applyTheme(getResolvedTheme());
}

export function cycleThemePreference(): ThemePreference {
  const cur = getStoredThemePreference();
  const next: ThemePreference =
    cur === 'system' ? 'light' : cur === 'light' ? 'dark' : 'system';
  persistTheme(next);
  return next;
}

let mqListenerBound = false;

/** À appeler une fois au démarrage : réagit aux changements d'apparence système. */
export function wireSystemThemeListener(): void {
  if (mqListenerBound || typeof window === 'undefined' || !window.matchMedia)
    return;
  mqListenerBound = true;
  const mq = window.matchMedia('(prefers-color-scheme: light)');
  mq.addEventListener('change', () => {
    if (getStoredThemePreference() !== 'system') return;
    applyTheme(getResolvedTheme());
  });
}

const SVG_COMMON = `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;

const THEME_ICONS: Record<ThemePreference, string> = {
  light: `<svg ${SVG_COMMON}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
  dark: `<svg ${SVG_COMMON}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  system: `<svg ${SVG_COMMON}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
};

/**
 * Met à jour l'icône et le label du bouton selon la préférence courante.
 * Appeler après chaque appel à cycleThemePreference().
 */
export function syncThemeButton(btn: HTMLButtonElement, animate = false): void {
  const pref = getStoredThemePreference();
  const labels: Record<ThemePreference, string> = {
    light: 'Thème clair',
    dark: 'Thème sombre',
    system: 'Thème automatique',
  };
  btn.setAttribute('aria-label', labels[pref]);
  btn.title = labels[pref];
  btn.innerHTML = THEME_ICONS[pref];
  if (animate) {
    btn.classList.remove('btn-theme--anim');
    void btn.offsetWidth; // force reflow
    btn.classList.add('btn-theme--anim');
  }
}
