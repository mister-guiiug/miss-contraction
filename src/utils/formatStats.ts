/**
 * Formate un nombre de millisecondes en horloge type 01:05
 * Utilisé pour les moyennes affichées dans les bandeaux statistiques
 * @param ms - Durée en millisecondes
 * @returns Texte formaté (ex: "01:05", ou "—" si invalide)
 */
export function formatStatsClock(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Calcule une estimation de contractions par heure
 * @param meanIntervalMs - Intervalle moyen en millisecondes
 * @returns Texte formaté (ex: "≈ 12,5 / h")
 */
export function formatContractionsPerHour(meanIntervalMs: number): string {
  if (!Number.isFinite(meanIntervalMs) || meanIntervalMs <= 0) return '—';
  const perHour = 3600000 / meanIntervalMs;
  const dec = perHour >= 10 ? 0 : perHour >= 3 ? 1 : 2;
  const s = perHour.toFixed(dec).replace('.', ',');
  return `≈ ${s} / h`;
}

/**
 * Formate une date/heure pour affichage dans l'historique
 */
const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTime(ms: number): string {
  return dateTimeFmt.format(new Date(ms));
}
