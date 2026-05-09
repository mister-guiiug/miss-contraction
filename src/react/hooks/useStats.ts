import { useMemo } from 'react';
import type {
  ContractionRecord,
  AppSettings,
  StatsWindowKey,
} from '../../storage';
import {
  filterRecordsByStatsWindow,
  getRecentIntervalsMs,
  computeThresholdBadge,
  type ThresholdBadgeKind,
} from '../../statsHelpers';
import {
  formatStatsClock,
  formatContractionsPerHour,
} from '../../utils/formatStats';
import { formatDuration } from '../../utils/formatDuration';
import { useNow } from './useNow';

interface StatsData {
  qtyPerHour: string;
  avgDuration: string;
  avgFrequency: string;
  lastHourCount: number;
  perHourFromMean: string;
  lastInterval: string;
  lastDuration: string;
  humanSummary: string;
  thresholdKind: ThresholdBadgeKind;
  intervals: number[];
  recordsForChart: ContractionRecord[];
}

interface StatsReturn {
  data: StatsData;
  windowLabel: string;
  isEmpty: boolean;
}

/**
 * Calcule les statistiques pour la page d'accueil
 */
export function useStats(
  records: ContractionRecord[],
  settings: AppSettings
): StatsReturn {
  const now = useNow(1000);
  const {
    avgDuration,
    avgFrequency,
    isEmpty,
    intervals,
    lastDuration,
    lastHourCount,
    lastInterval,
    perHourFromMean,
    qtyPerHour,
    recordsForChart,
    thresholdKind,
    humanSummary,
    windowLabel,
  } = useMemo(() => {
    const allValid = records.filter(r => r.end > r.start);
    const sorted = [...allValid].sort((a, b) => a.start - b.start);
    const done = filterRecordsByStatsWindow(
      sorted,
      settings.statsWindowMinutes,
      now
    );

    const isEmpty = done.length === 0;

    // Intervalles pour le graphique
    const intervals = getRecentIntervalsMs(done, 14);
    const recordsForChart = done.slice(-intervals.length - 1);

    // Stats principales
    let qtyPerHour = '—';
    let avgDuration = '—';
    let avgFrequency = '—';
    let lastHourCount = 0;
    let perHourFromMean = '—';
    let lastInterval = '—';
    let lastDuration = '—';

    if (!isEmpty) {
      // Moyenne intervalle
      const meanInterval = meanStartIntervalMs(done);
      // Moyenne durée
      const meanDur = meanContractionDurationMs(done);

      qtyPerHour =
        meanInterval != null && meanInterval > 0
          ? String(Math.round(3600000 / meanInterval))
          : '—';

      avgDuration = meanDur != null ? formatStatsClock(meanDur) : '—';
      avgFrequency =
        meanInterval != null ? formatStatsClock(meanInterval) : '—';

      lastHourCount = countContractionsStartingInLastHour(allValid, now);
      perHourFromMean =
        meanInterval != null ? formatContractionsPerHour(meanInterval) : '—';

      const last = sorted.length > 0 ? sorted[sorted.length - 1]! : null;
      lastDuration = last ? formatDuration(last.end - last.start) : '—';

      if (sorted.length >= 2 && last) {
        const prev = sorted[sorted.length - 2]!;
        lastInterval = formatDuration(last.start - prev.start);
      }
    }

    // Calcul du résumé en langage naturel
    let humanSummary = '';
    if (!isEmpty) {
      if (sorted.length >= 3) {
        const last = sorted[sorted.length - 1]!;
        const prev = sorted[sorted.length - 2]!;
        const prev2 = sorted[sorted.length - 3]!;

        const lastIntervalVal = last.start - prev.start;
        const prevIntervalVal = prev.start - prev2.start;

        if (lastIntervalVal < prevIntervalVal * 0.9) {
          humanSummary = 'Les contractions se rapprochent.';
        } else if (lastIntervalVal > prevIntervalVal * 1.1) {
          humanSummary = 'Le rythme semble se calmer un peu.';
        } else {
          humanSummary = 'Le rythme est stable.';
        }

        if (
          last.intensity &&
          prev.intensity &&
          last.intensity > prev.intensity
        ) {
          humanSummary += ' L’intensité augmente.';
        }
      } else {
        humanSummary = 'Suivi en cours...';
      }
    }

    // Badge de seuil
    const thresholdKind = computeThresholdBadge(records, settings);

    // Label de fenêtre
    const windowLabel = statsWindowLabel(settings.statsWindowMinutes);

    return {
      qtyPerHour,
      avgDuration,
      avgFrequency,
      lastHourCount,
      perHourFromMean,
      lastInterval,
      lastDuration,
      humanSummary,
      thresholdKind,
      intervals,
      recordsForChart,
      windowLabel,
      isEmpty,
    };
  }, [now, records, settings]);

  return {
    data: {
      qtyPerHour,
      avgDuration,
      avgFrequency,
      lastHourCount,
      perHourFromMean,
      lastInterval,
      lastDuration,
      humanSummary,
      thresholdKind,
      intervals,
      recordsForChart,
    },
    windowLabel,
    isEmpty,
  };
}

function meanStartIntervalMs(done: ContractionRecord[]): number | null {
  if (done.length < 2) return null;
  let sum = 0;
  for (let i = 1; i < done.length; i++) {
    sum += done[i]!.start - done[i - 1]!.start;
  }
  return sum / (done.length - 1);
}

function meanContractionDurationMs(done: ContractionRecord[]): number | null {
  if (done.length === 0) return null;
  let sum = 0;
  for (const r of done) {
    sum += r.end - r.start;
  }
  return sum / done.length;
}

function countContractionsStartingInLastHour(
  done: ContractionRecord[],
  nowMs: number
): number {
  const t0 = nowMs - 60 * 60 * 1000;
  return done.filter(r => r.start >= t0).length;
}

function statsWindowLabel(key: StatsWindowKey): string {
  if (key === 'all') return 'Moyennes sur toutes les données enregistrées.';
  const n = key === '30' ? 30 : key === '60' ? 60 : 120;
  return `Moyennes sur les ${n} dernières minutes (début de contraction).`;
}
