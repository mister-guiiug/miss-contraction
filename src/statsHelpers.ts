import type { AppSettings, ContractionRecord, StatsWindowKey } from "./storage";

export function filterRecordsByStatsWindow(
  done: ContractionRecord[],
  key: StatsWindowKey,
  nowMs: number
): ContractionRecord[] {
  if (key === "all" || done.length === 0) return done;
  const mins = key === "30" ? 30 : key === "60" ? 60 : 120;
  const t0 = nowMs - mins * 60 * 1000;
  return done.filter((r) => r.start >= t0);
}

/** Intervalles entre débuts consécutifs (ms), jusqu’à `max` derniers. */
export function getRecentIntervalsMs(
  chronological: ContractionRecord[],
  max: number
): number[] {
  if (chronological.length < 2) return [];
  const out: number[] = [];
  for (let i = 1; i < chronological.length; i++) {
    out.push(chronological[i]!.start - chronological[i - 1]!.start);
  }
  return out.slice(-max);
}

export type ThresholdBadgeKind = "match" | "approaching" | "calm" | "empty";

export function computeThresholdBadge(
  records: ContractionRecord[],
  settings: AppSettings
): ThresholdBadgeKind {
  const done = records.filter((r) => r.end > r.start);
  if (done.length === 0) return "empty";
  const n = settings.consecutiveCount;
  if (done.length < n) {
    if (done.length >= 2) {
      const a = done[done.length - 2]!;
      const b = done[done.length - 1]!;
      const diffMin = (b.start - a.start) / 60_000;
      if (diffMin <= settings.maxIntervalMin * 1.2) return "approaching";
    }
    return "calm";
  }
  const slice = done.slice(-n);
  const intervalsOk = slice.slice(1).every((r, i) => {
    const prev = slice[i]!;
    return (r.start - prev.start) / 60_000 <= settings.maxIntervalMin;
  });
  const durationsOk = slice.every(
    (r) => (r.end - r.start) / 1000 >= settings.minDurationSec
  );
  if (intervalsOk && durationsOk) return "match";
  const last = done[done.length - 1]!;
  const prev = done[done.length - 2]!;
  const diffMin = (last.start - prev.start) / 60_000;
  if (diffMin <= settings.maxIntervalMin * 1.2) return "approaching";
  return "calm";
}

/**
 * Instant où le seuil d’alerte a été atteint pour la première fois dans l’historique :
 * fin de la Nième contraction du premier groupe consécutif qui respecte intervalle + durée
 * (même règle que l’alerte notification / badge « correspond aux seuils »).
 */
export function findFirstThresholdMatchEndMs(
  records: ContractionRecord[],
  settings: AppSettings
): number | null {
  const sorted = [...records]
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start);
  const n = settings.consecutiveCount;
  if (sorted.length < n) return null;
  for (let endIdx = n - 1; endIdx < sorted.length; endIdx++) {
    const slice = sorted.slice(endIdx - n + 1, endIdx + 1);
    const intervalsOk = slice.slice(1).every((r, i) => {
      const prev = slice[i]!;
      return (r.start - prev.start) / 60_000 <= settings.maxIntervalMin;
    });
    const durationsOk = slice.every(
      (r) => (r.end - r.start) / 1000 >= settings.minDurationSec
    );
    if (intervalsOk && durationsOk) return slice[n - 1]!.end;
  }
  return null;
}
