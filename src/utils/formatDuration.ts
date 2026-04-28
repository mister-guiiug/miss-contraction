/**
 * Formate une durée en millisecondes en texte lisible
 * @param ms - Durée en millisecondes
 * @returns Texte formaté (ex: "45 s", "2 min 15 s", ou "—" si invalide)
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const sec = Math.round(ms / 1000);
  if (sec < 120) return `${sec} s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m} min ${s} s`;
}
