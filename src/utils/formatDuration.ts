/**
 * Les durées de l'application, en deux formats et pas un de plus.
 *
 * ── POURQUOI DEUX, ET POURQUOI SEULEMENT DEUX ────────────────────────────────
 *
 * Sept fonctions rendaient une durée, pour quatre formes différentes : `00:45`,
 * `31:48`, `1:02`, `45s`, `2 min 15 s`. Un même écran en affichait jusqu'à six
 * à la fois — la durée moyenne en `01:00`, la dernière durée en `72 s`, l'écart
 * en `4 min 0 s`, la timeline en `1:02`. Rien ne se compare quand rien ne
 * s'écrit pareil.
 *
 * `formatClock` sert aux DEUX COMPTEURS QUI TOURNENT : la contraction en cours
 * et le repos depuis la dernière. On les lit d'un coup d'œil, en pleine
 * contraction, et un chronomètre se lit `MM:SS` — pas « 1 min 12 s » qui change
 * de largeur à chaque seconde.
 *
 * `formatDuration` sert à TOUT LE RESTE : une valeur enregistrée, qu'on lit
 * pour la comparer. Elle s'écrit dans les unités des seuils que
 * l'utilisatrice a elle-même réglés — « durée ≥ 45 s », « écart ≤ 5 min ».
 * `01:00` obligeait à convertir de tête pour savoir si le seuil était franchi.
 */

/**
 * Une durée enregistrée : « 45 s », « 2 min 15 s », « 1 h 5 min ».
 *
 * Les secondes disparaissent au-delà de l'heure — à cette échelle elles ne
 * disent plus rien — et quand elles valent zéro, pour éviter le « 4 min 0 s »
 * qui se lisait comme une troncature.
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const sec = Math.round(ms / 1000);

  if (sec < 120) return `${sec} s`;

  if (sec < 3600) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s === 0 ? `${m} min` : `${m} min ${s} s`;
  }

  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/**
 * Un compteur qui tourne : « 00:45 », « 31:48 », « 01:02:03 ».
 *
 * L'heure n'apparaît que lorsqu'elle existe : un repos de trois minutes n'a
 * pas à afficher deux zéros de plus.
 */
export function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '00:00';
  const total = Math.floor(totalSeconds);

  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const parts: string[] = [];
  if (hrs > 0) parts.push(String(hrs).padStart(2, '0'));
  parts.push(String(mins).padStart(2, '0'));
  parts.push(String(secs).padStart(2, '0'));

  return parts.join(':');
}
