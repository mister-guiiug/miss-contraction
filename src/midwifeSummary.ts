/**
 * Résumé sage-femme — construction pure du texte partagé.
 *
 * Extrait de MidwifeView pour être réutilisé tel quel par l'export PDF :
 * mêmes données → mêmes lignes, que la sortie soit le presse-papiers,
 * l'impression ou un fichier téléchargé.
 */

import type { ContractionRecord } from './storage';
import { formatStatsClock } from './utils/formatStats';
import { getDefaultLocale } from '@mister-guiiug/dev-pwa-config/format';

/** Période affichée : N dernières contractions ou tout l'historique. */
export type MidwifeMode = '6' | '10' | '12' | '20' | 'all';

/** Seuils utilisés par le résumé (sous-ensemble des réglages de l'app). */
export interface MidwifeThresholds {
  consecutiveCount: number;
  maxIntervalMin: number;
  minDurationSec: number;
}

/** Données nécessaires (et suffisantes) au résumé — aucune lecture d'état. */
export interface MidwifeSummaryInput {
  /** Contractions retenues : valides (fin > début), ordre chronologique. */
  selectedRecords: ContractionRecord[];
  /** Seuils configurés dans l'application. */
  settings: MidwifeThresholds;
  /** Période choisie pour le tableau et les moyennes. */
  mode: MidwifeMode;
  /** Fin du premier groupe remplissant les seuils (tout l'historique), sinon null. */
  firstThresholdEndMs: number | null;
  /** Instant de génération affiché dans l'en-tête. */
  generatedAtMs: number;
}

/** Moyenne des écarts entre débuts consécutifs, en ms (null si < 2). */
export function meanStartIntervalMs(done: ContractionRecord[]): number | null {
  if (done.length < 2) return null;
  let sum = 0;
  for (let i = 1; i < done.length; i++) {
    sum += done[i]!.start - done[i - 1]!.start;
  }
  return sum / (done.length - 1);
}

/** Durée moyenne d'une contraction, en ms (null si aucune). */
export function meanContractionDurationMs(
  done: ContractionRecord[]
): number | null {
  if (done.length === 0) return null;
  let sum = 0;
  for (const r of done) {
    sum += r.end - r.start;
  }
  return sum / done.length;
}

/**
 * Durée compacte m:ss (ex. 1:05), propre au résumé sage-femme —
 * ne pas confondre avec `utils/formatDuration` (« 2 min 15 s »).
 */
export function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Début de contraction dans le détail (ex. « sam. 30 août, 14:05 »). */
export const midwifeDateTimeFmt = new Intl.DateTimeFormat(getDefaultLocale(), {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/** Premier seuil atteint, en toutes lettres. */
export const midwifeDateTimeFmtLong = new Intl.DateTimeFormat(
  getDefaultLocale(),
  {
    dateStyle: 'full',
    timeStyle: 'short',
  }
);

const midwifeHeaderFmt = new Intl.DateTimeFormat(getDefaultLocale(), {
  dateStyle: 'medium',
  timeStyle: 'short',
});

/** Le résumé, ligne à ligne (les lignes vides séparent les sections). */
export function buildMidwifeSummaryLines(input: MidwifeSummaryInput): string[] {
  const {
    selectedRecords,
    settings,
    mode,
    firstThresholdEndMs,
    generatedAtMs,
  } = input;
  const meanInterval = meanStartIntervalMs(selectedRecords);
  const meanDur = meanContractionDurationMs(selectedRecords);
  const qtyHour =
    meanInterval != null && meanInterval > 0
      ? String(Math.round(3600000 / meanInterval))
      : '—';

  const lines: string[] = [];
  lines.push('Miss Contraction — Résumé pour la sage-femme');
  lines.push(`Généré le ${midwifeHeaderFmt.format(generatedAtMs)}`);
  lines.push('');
  lines.push("Seuils configurés dans l'application :");
  lines.push(
    `— ${settings.consecutiveCount} contractions consécutives, écart entre débuts ≤ ${settings.maxIntervalMin} min, durée ≥ ${settings.minDurationSec} s chacune.`
  );
  lines.push('');
  if (firstThresholdEndMs != null) {
    lines.push(
      `Première fois où ces critères ont été remplis (sur tout l'historique) : ${midwifeDateTimeFmtLong.format(firstThresholdEndMs)}.`
    );
  } else {
    lines.push(
      "Aucun groupe de contractions consécutives n'a encore rempli ces critères dans l'historique enregistré."
    );
  }
  lines.push('');
  const modeLabel =
    mode === 'all' ? "tout l'historique" : `les ${mode} dernières contractions`;
  lines.push(
    `Période du tableau et des moyennes : ${modeLabel} (${selectedRecords.length} contraction(s)).`
  );
  lines.push('');
  if (selectedRecords.length === 0) {
    lines.push('Aucune contraction dans cette sélection.');
    lines.push('');
    lines.push('—');
    lines.push('Données indicatives — ne remplacent pas un avis médical.');
    return lines;
  }
  lines.push('Moyennes sur cette sélection :');
  lines.push(
    `— Quantité estimée : ≈ ${qtyHour} contraction(s) / h (si le rythme restait constant).`
  );
  lines.push(
    `— Durée moyenne : ${meanDur != null ? formatStatsClock(meanDur) : '—'} (mm:ss).`
  );
  lines.push(
    `— Intervalle moyen entre débuts : ${meanInterval != null ? formatStatsClock(meanInterval) : '—'} (mm:ss).`
  );
  lines.push('');
  lines.push('Détail (ordre chronologique) :');
  for (let i = 0; i < selectedRecords.length; i++) {
    const r = selectedRecords[i]!;
    const intervalMs = i > 0 ? r.start - selectedRecords[i - 1]!.start : null;
    const intervalStr = intervalMs != null ? formatDuration(intervalMs) : '—';
    const note = r.note?.trim();
    const intensity = r.intensity ? ` — intensité : ${r.intensity}` : '';
    lines.push(
      `${i + 1}. ${midwifeDateTimeFmt.format(r.start)} — durée ${formatDuration(r.end - r.start)} — écart depuis précédente : ${intervalStr}${intensity}${note ? ` — note : ${note}` : ''}`
    );
  }
  lines.push('');
  lines.push('—');
  lines.push('Données indicatives — ne remplacent pas un avis médical.');
  return lines;
}

/** Le résumé complet, prêt pour le presse-papiers. */
export function buildMidwifeSummaryText(input: MidwifeSummaryInput): string {
  return buildMidwifeSummaryLines(input).join('\n');
}
