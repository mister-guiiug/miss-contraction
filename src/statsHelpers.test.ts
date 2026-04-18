import { describe, it, expect } from 'vitest';
import {
  filterRecordsByStatsWindow,
  getRecentIntervalsMs,
  computeThresholdBadge,
} from './statsHelpers';
import type { ContractionRecord, AppSettings } from './storage';

const defaultSettings: AppSettings = {
  maxIntervalMin: 5,
  minDurationSec: 45,
  consecutiveCount: 3,
  notificationsEnabled: false,
  statsWindowMinutes: 'all',
  preAlertEnabled: true,
  openContractionReminderMin: 4,
  maternityLabel: '',
  maternityPhone: '',
  maternityAddress: '',
  largeMode: false,
  keepAwakeDuringContraction: true,
  vibrationEnabled: true,
  voiceCommandsEnabled: false,
  moduleVoiceCommands: true,
  moduleMaternityMessage: true,
};

function makeRecord(start: number, durationMs: number): ContractionRecord {
  return { id: String(start), start, end: start + durationMs };
}

describe('filterRecordsByStatsWindow', () => {
  const now = Date.now();
  const r1 = makeRecord(now - 90 * 60_000, 60_000);
  const r2 = makeRecord(now - 45 * 60_000, 60_000);
  const r3 = makeRecord(now - 10 * 60_000, 60_000);

  it('retourne tout quand key="all"', () => {
    expect(filterRecordsByStatsWindow([r1, r2, r3], 'all', now)).toHaveLength(
      3
    );
  });

  it('filtre correctement pour 30 min', () => {
    const result = filterRecordsByStatsWindow([r1, r2, r3], '30', now);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(r3);
  });

  it('filtre correctement pour 60 min', () => {
    const result = filterRecordsByStatsWindow([r1, r2, r3], '60', now);
    expect(result).toHaveLength(2);
  });

  it('retourne [] si tableau vide', () => {
    expect(filterRecordsByStatsWindow([], '30', now)).toHaveLength(0);
  });
});

describe('getRecentIntervalsMs', () => {
  it('retourne [] si moins de 2 enregistrements', () => {
    expect(getRecentIntervalsMs([], 10)).toEqual([]);
    expect(getRecentIntervalsMs([makeRecord(0, 1000)], 10)).toEqual([]);
  });

  it('retourne les intervalles entre débuts consécutifs', () => {
    const r1 = makeRecord(0, 1000);
    const r2 = makeRecord(5 * 60_000, 1000);
    const r3 = makeRecord(9 * 60_000, 1000);
    const result = getRecentIntervalsMs([r1, r2, r3], 10);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(5 * 60_000);
    expect(result[1]).toBe(4 * 60_000);
  });

  it('limite au nombre max demandé', () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord(i * 60_000, 30_000)
    );
    expect(getRecentIntervalsMs(records, 3)).toHaveLength(3);
  });
});

describe('computeThresholdBadge', () => {
  it('retourne "empty" si aucun enregistrement terminé', () => {
    expect(computeThresholdBadge([], defaultSettings)).toBe('empty');
  });

  it('retourne "match" quand le seuil est atteint', () => {
    const now = Date.now();
    const records = [
      makeRecord(now - 15 * 60_000, 60_000), // 5 min before next
      makeRecord(now - 10 * 60_000, 60_000), // 5 min before next
      makeRecord(now - 5 * 60_000, 60_000),
    ];
    expect(computeThresholdBadge(records, defaultSettings)).toBe('match');
  });

  it('retourne "calm" quand les intervalles sont trop grands', () => {
    const now = Date.now();
    const records = [
      makeRecord(now - 40 * 60_000, 60_000),
      makeRecord(now - 20 * 60_000, 60_000),
      makeRecord(now - 5 * 60_000, 60_000),
    ];
    expect(computeThresholdBadge(records, defaultSettings)).toBe('calm');
  });

  it('retourne "approaching" quand le rythme se resserre (< 2 × seuil)', () => {
    const now = Date.now();
    // 2 contractions, intervalle = 6 min ≤ 5 × 1.2 = 6 → approaching
    const records = [
      makeRecord(now - 12 * 60_000, 60_000),
      makeRecord(now - 6 * 60_000, 60_000),
    ];
    expect(computeThresholdBadge(records, defaultSettings)).toBe('approaching');
  });

  it('retourne "calm" si une seule contraction terminée', () => {
    const now = Date.now();
    expect(
      computeThresholdBadge(
        [makeRecord(now - 5 * 60_000, 60_000)],
        defaultSettings
      )
    ).toBe('calm');
  });
});
