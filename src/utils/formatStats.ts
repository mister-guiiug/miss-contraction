import { getDefaultLocale } from '@mister-guiiug/dev-pwa-config/format';

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
const dateTimeFmt = new Intl.DateTimeFormat(getDefaultLocale(), {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateTime(ms: number): string {
  return dateTimeFmt.format(new Date(ms));
}
