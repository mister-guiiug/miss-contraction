import { useMemo } from 'react';
import type {
  ContractionRecord,
  AppSettings,
  StatsWindowKey,
} from '../../storage';
import { filterRecordsByStatsWindow } from '../../statsHelpers';
import { formatDuration } from '../../utils/formatDuration';
import { interpolate, t, type AppLanguage } from '../../i18n';
import { useNow } from './useNow';

interface StatsData {
  qtyPerHour: string;
  avgDuration: string;
  avgFrequency: string;
  lastHourCount: number;
  lastInterval: string;
  lastDuration: string;
}

interface StatsReturn {
  data: StatsData;
  windowLabel: string;
  isEmpty: boolean;
}

/**
 * Les indicateurs de l'accueil.
 *
 * `qtyPerHour` était calculé deux fois : ici en entier, et une seconde fois
 * dans `formatContractionsPerHour` à la décimale près. L'écran affichait donc
 * « 9 » et « ≈ 9,2 / h » côte à côte, sous deux libellés, pour la même
 * division. Une seule valeur sort désormais d'ici.
 */
export function useStats(
  records: ContractionRecord[],
  settings: AppSettings
): StatsReturn {
  const now = useNow(1000);
  const language = settings.language;

  const {
    avgDuration,
    avgFrequency,
    isEmpty,
    lastDuration,
    lastHourCount,
    lastInterval,
    qtyPerHour,
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

    let qtyPerHour = '—';
    let avgDuration = '—';
    let avgFrequency = '—';
    let lastHourCount = 0;
    let lastInterval = '—';
    let lastDuration = '—';

    if (!isEmpty) {
      const meanInterval = meanStartIntervalMs(done);
      const meanDur = meanContractionDurationMs(done);

      qtyPerHour =
        meanInterval != null && meanInterval > 0
          ? String(Math.round(3600000 / meanInterval))
          : '—';

      avgDuration = meanDur != null ? formatDuration(meanDur) : '—';
      avgFrequency = meanInterval != null ? formatDuration(meanInterval) : '—';

      lastHourCount = countContractionsStartingInLastHour(allValid, now);

      const last = sorted.length > 0 ? sorted[sorted.length - 1]! : null;
      lastDuration = last ? formatDuration(last.end - last.start) : '—';

      if (sorted.length >= 2 && last) {
        const prev = sorted[sorted.length - 2]!;
        lastInterval = formatDuration(last.start - prev.start);
      }
    }

    const windowLabel = statsWindowLabel(language, settings.statsWindowMinutes);

    return {
      qtyPerHour,
      avgDuration,
      avgFrequency,
      lastHourCount,
      lastInterval,
      lastDuration,
      windowLabel,
      isEmpty,
    };
  }, [language, now, records, settings]);

  return {
    data: {
      qtyPerHour,
      avgDuration,
      avgFrequency,
      lastHourCount,
      lastInterval,
      lastDuration,
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

function statsWindowLabel(language: AppLanguage, key: StatsWindowKey): string {
  if (key === 'all') return t(language, 'stats.windowAll');
  const n = key === '30' ? 30 : key === '60' ? 60 : 120;
  return interpolate(t(language, 'stats.windowMinutes'), { minutes: n });
}
