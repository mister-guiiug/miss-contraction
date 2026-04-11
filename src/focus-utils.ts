/** Déplace le focus sur le contenu principal après un changement de route (accessibilité). */
export function focusMainContent(): void {
  const main = document.getElementById("main-content") ??
    document.querySelector<HTMLElement>(".app, main, [role=\"main\"]");
  if (!main) return;
  if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
  main.focus({ preventScroll: true });
}
