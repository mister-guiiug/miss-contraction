/**
 * Utilitaires HTML partagés.
 * Toute chaîne interpolée dans un template HTML doit passer par `escapeHtml`
 * (ou être insérée via `textContent`).
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
