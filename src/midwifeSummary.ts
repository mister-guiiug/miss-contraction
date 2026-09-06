/**
 * Résumé sage-femme — construction pure du texte partagé.
 *
 * Extrait de MidwifeView pour être réutilisé tel quel par l'export PDF :
 * mêmes données → mêmes lignes, que la sortie soit le presse-papiers,
 * l'impression ou un fichier téléchargé.
 */

import type { ContractionRecord } from './storage';
import { formatDuration } from './utils/formatDuration';
import { interpolate, t, type AppLanguage } from './i18n';
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
  /**
   * Langue du résumé. Le texte était écrit en français dans le code, pour
   * tout le monde : l'écran, le presse-papiers et le PDF doivent parler la
   * même langue que le reste de l'application.
   */
  language: AppLanguage;
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
    language,
  } = input;
  const meanInterval = meanStartIntervalMs(selectedRecords);
  const meanDur = meanContractionDurationMs(selectedRecords);
  const qtyHour =
    meanInterval != null && meanInterval > 0
      ? String(Math.round(3600000 / meanInterval))
      : '—';

  const tr = (key: string) => t(language, key);
  const trv = (key: string, values: Record<string, string | number>) =>
    interpolate(t(language, key), values);

  const lines: string[] = [];
  lines.push(tr('midwife.docTitle'));
  lines.push(
    trv('midwife.generatedOn', {
      date: midwifeHeaderFmt.format(generatedAtMs),
    })
  );
  lines.push('');
  // `renderMidwifePdf` met en gras toute ligne finissant par « : » — les
  // traductions des têtes de section doivent conserver ce deux-points.
  lines.push(tr('midwife.thresholdsHeading'));
  lines.push(
    `— ${trv('midwife.thresholdsText', {
      count: settings.consecutiveCount,
      interval: settings.maxIntervalMin,
      duration: settings.minDurationSec,
    })}`
  );
  lines.push('');
  if (firstThresholdEndMs != null) {
    lines.push(
      trv('midwife.firstMatchAt', {
        date: midwifeDateTimeFmtLong.format(firstThresholdEndMs),
      })
    );
  } else {
    lines.push(tr('midwife.firstMatchNoneLong'));
  }
  lines.push('');
  const modeLabel =
    mode === 'all'
      ? tr('midwife.modeAllLower')
      : trv('midwife.modeLastNLower', { n: mode });
  lines.push(
    trv('midwife.periodLine', {
      mode: modeLabel,
      count: selectedRecords.length,
    })
  );
  lines.push('');
  if (selectedRecords.length === 0) {
    lines.push(tr('midwife.emptySelection'));
    lines.push('');
    lines.push('—');
    lines.push(tr('midwife.disclaimer'));
    return lines;
  }
  lines.push(tr('midwife.averagesHeading'));
  lines.push(`— ${trv('midwife.statQtyLong', { value: qtyHour })}`);
  lines.push(
    `— ${trv('midwife.statDurationLong', {
      value: meanDur != null ? formatDuration(meanDur) : '—',
    })}`
  );
  lines.push(
    `— ${trv('midwife.statIntervalLong', {
      value: meanInterval != null ? formatDuration(meanInterval) : '—',
    })}`
  );
  lines.push('');
  lines.push(tr('midwife.detailHeading'));
  for (let i = 0; i < selectedRecords.length; i++) {
    const r = selectedRecords[i]!;
    const intervalMs = i > 0 ? r.start - selectedRecords[i - 1]!.start : null;
    const intervalStr = intervalMs != null ? formatDuration(intervalMs) : '—';
    const note = r.note?.trim();
    const intensity = r.intensity
      ? trv('midwife.detailIntensity', { value: r.intensity })
      : '';
    const noteText = note ? trv('midwife.detailNote', { value: note }) : '';
    lines.push(
      trv('midwife.detailLine', {
        num: i + 1,
        start: midwifeDateTimeFmt.format(r.start),
        duration: formatDuration(r.end - r.start),
        interval: intervalStr,
      }) +
        intensity +
        noteText
    );
  }
  lines.push('');
  lines.push('—');
  lines.push(tr('midwife.disclaimer'));
  return lines;
}

/** Le résumé complet, prêt pour le presse-papiers. */
export function buildMidwifeSummaryText(input: MidwifeSummaryInput): string {
  return buildMidwifeSummaryLines(input).join('\n');
}
