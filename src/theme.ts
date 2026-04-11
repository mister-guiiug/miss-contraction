const LS_THEME = "mc_theme";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export function getStoredThemePreference(): ThemePreference {
  const s = localStorage.getItem(LS_THEME);
  if (s === "light" || s === "dark" || s === "system") return s;
  return "system";
}

export function getResolvedTheme(): ResolvedTheme {
  const pref = getStoredThemePreference();
  if (pref === "light") return "light";
  if (pref === "dark") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.setAttribute("data-theme", theme);
  const meta = document.querySelector<HTMLMetaElement>("meta[name=\"theme-color\"]");
  if (meta) {
    meta.setAttribute("content", theme === "light" ? "#a0309a" : "#3d1040");
  }
}

export function applyResolvedTheme(): void {
  applyTheme(getResolvedTheme());
}

export function persistTheme(pref: ThemePreference): void {
  const t: ThemePreference =
    pref === "light" || pref === "dark" || pref === "system" ? pref : "system";
  localStorage.setItem(LS_THEME, t);
  applyTheme(getResolvedTheme());
}

export function cycleThemePreference(): ThemePreference {
  const cur = getStoredThemePreference();
  const next: ThemePreference =
    cur === "system" ? "light" : cur === "light" ? "dark" : "system";
  persistTheme(next);
  return next;
}

let mqListenerBound = false;

/** À appeler une fois au démarrage : réagit aux changements d'apparence système. */
export function wireSystemThemeListener(): void {
  if (mqListenerBound || typeof window === "undefined" || !window.matchMedia) return;
  mqListenerBound = true;
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  mq.addEventListener("change", () => {
    if (getStoredThemePreference() !== "system") return;
    applyTheme(getResolvedTheme());
  });
}

/**
 * Met à jour l'icône et le label du bouton selon la préférence courante.
 * Appeler après chaque appel à cycleThemePreference().
 */
export function syncThemeButton(btn: HTMLButtonElement): void {
  const pref = getStoredThemePreference();
  const labels: Record<ThemePreference, string> = {
    light: "Thème clair",
    dark: "Thème sombre",
    system: "Thème automatique",
  };
  const icons: Record<ThemePreference, string> = { light: "☀", dark: "🌙", system: "🖥" };
  btn.textContent = icons[pref];
  btn.setAttribute("aria-label", labels[pref]);
  btn.title = labels[pref];
}
