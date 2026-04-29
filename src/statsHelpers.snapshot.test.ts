/**
 * Tests snapshot de la logique métier
 * Utilise toMatchSnapshot() de Vitest pour détecter toute régression
 * dans les calculs de stats, thresholds et formatages
 */

import { describe, it, expect } from 'vitest';
import {
  filterRecordsByStatsWindow,
  getRecentIntervalsMs,
  computeThresholdBadge,
} from './statsHelpers';
import type { ContractionRecord, AppSettings } from './storage';
import { formatDuration } from './utils/formatDuration';
import { formatStatsClock, formatContractionsPerHour } from './utils/formatStats';

// ============================================================
// Fixtures
// ============================================================

const DEFAULT_SETTINGS: AppSettings = {
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

// Date de référence fixe pour des snapshots déterministes
const BASE_TIME = new Date('2024-01-15T10:00:00.000Z').getTime();

function makeRecord(
  startOffsetMin: number,
  durationSec: number,
  extra?: Partial<ContractionRecord>
): ContractionRecord {
  const start = BASE_TIME - startOffsetMin * 60_000;
  return {
    id: `rec_${startOffsetMin}`,
    start,
    end: start + durationSec * 1000,
    ...extra,
  };
}

// Scénario 1 : contractions régulières toutes les 5 min (règle 5-1-1)
const REGULAR_5MIN = [
  makeRecord(20, 60),
  makeRecord(15, 65),
  makeRecord(10, 70),
  makeRecord(5, 75),
  makeRecord(0, 80),
];

// Scénario 2 : contractions espacées (pas d'alerte)
const SPARSE = [
  makeRecord(90, 50),
  makeRecord(60, 55),
  makeRecord(30, 60),
];

// Scénario 3 : contractions rapprochées courtes (durée insuffisante)
const SHORT_CONTRACTIONS = [
  makeRecord(10, 20), // 20s < 45s seuil
  makeRecord(5, 20),
  makeRecord(0, 20),
];

// Scénario 4 : une seule contraction
const SINGLE = [makeRecord(5, 60)];

// Scénario 5 : approaching (2 contractions proches)
const APPROACHING = [
  makeRecord(12, 60),
  makeRecord(6, 60),
];

// ============================================================
// Snapshots - filterRecordsByStatsWindow
// ============================================================

describe('Snapshot: filterRecordsByStatsWindow', () => {
  it('filtre "all" retourne tout le tableau (snapshot)', () => {
    const result = filterRecordsByStatsWindow(REGULAR_5MIN, 'all', BASE_TIME);
    expect(result.map((r) => r.id)).toMatchSnapshot();
  });

  it('filtre "30" retourne les 30 dernières minutes (snapshot)', () => {
    const result = filterRecordsByStatsWindow(REGULAR_5MIN, '30', BASE_TIME);
    expect(result.map((r) => r.id)).toMatchSnapshot();
  });

  it('filtre "60" retourne les 60 dernières minutes (snapshot)', () => {
    const all = [
      makeRecord(90, 60),
      makeRecord(45, 60),
      makeRecord(20, 60),
      makeRecord(5, 60),
    ];
    const result = filterRecordsByStatsWindow(all, '60', BASE_TIME);
    expect(result.map((r) => r.id)).toMatchSnapshot();
  });

  it('filtre "120" retourne les 2 dernières heures (snapshot)', () => {
    const all = [
      makeRecord(150, 60),
      makeRecord(90, 60),
      makeRecord(45, 60),
    ];
    const result = filterRecordsByStatsWindow(all, '120', BASE_TIME);
    expect(result.map((r) => r.id)).toMatchSnapshot();
  });
});

// ============================================================
// Snapshots - getRecentIntervalsMs
// ============================================================

describe('Snapshot: getRecentIntervalsMs', () => {
  it('intervalles pour 5 contractions régulières (snapshot)', () => {
    const result = getRecentIntervalsMs(REGULAR_5MIN, 10);
    expect(result).toMatchSnapshot();
  });

  it('intervalles limités à 3 (snapshot)', () => {
    const result = getRecentIntervalsMs(REGULAR_5MIN, 3);
    expect(result).toMatchSnapshot();
  });

  it('intervalles pour contractions espacées (snapshot)', () => {
    const result = getRecentIntervalsMs(SPARSE, 10);
    expect(result).toMatchSnapshot();
  });
});

// ============================================================
// Snapshots - computeThresholdBadge
// ============================================================

describe('Snapshot: computeThresholdBadge - tous les états', () => {
  it('état "match" : règle 5-1-1 atteinte (snapshot)', () => {
    const kind = computeThresholdBadge(REGULAR_5MIN, DEFAULT_SETTINGS);
    expect(kind).toMatchSnapshot();
  });

  it('état "calm" : contractions espacées (snapshot)', () => {
    const kind = computeThresholdBadge(SPARSE, DEFAULT_SETTINGS);
    expect(kind).toMatchSnapshot();
  });

  it('état "approaching" : rythme qui se resserre (snapshot)', () => {
    const kind = computeThresholdBadge(APPROACHING, DEFAULT_SETTINGS);
    expect(kind).toMatchSnapshot();
  });

  it('état "empty" : aucun enregistrement (snapshot)', () => {
    const kind = computeThresholdBadge([], DEFAULT_SETTINGS);
    expect(kind).toMatchSnapshot();
  });

  it('état "calm" : contractions courtes, durée insuffisante (snapshot)', () => {
    const kind = computeThresholdBadge(SHORT_CONTRACTIONS, DEFAULT_SETTINGS);
    expect(kind).toMatchSnapshot();
  });

  it('état pour une seule contraction (snapshot)', () => {
    const kind = computeThresholdBadge(SINGLE, DEFAULT_SETTINGS);
    expect(kind).toMatchSnapshot();
  });
});

// ============================================================
// Snapshots - computeThresholdBadge avec settings variés
// ============================================================

describe('Snapshot: computeThresholdBadge - settings variés', () => {
  it('règle 4-1-1 (intervalleMax=4min) (snapshot)', () => {
    const settings = { ...DEFAULT_SETTINGS, maxIntervalMin: 4 };
    const kind = computeThresholdBadge(REGULAR_5MIN, settings);
    expect(kind).toMatchSnapshot();
  });

  it('règle 5-1-1 avec 4 contractions consécutives requises (snapshot)', () => {
    const settings = { ...DEFAULT_SETTINGS, consecutiveCount: 4 };
    const kind = computeThresholdBadge(REGULAR_5MIN, settings);
    expect(kind).toMatchSnapshot();
  });

  it('durée minimale 60s (contractions de 60s OK) (snapshot)', () => {
    const settings = { ...DEFAULT_SETTINGS, minDurationSec: 60 };
    const kind = computeThresholdBadge(REGULAR_5MIN, settings);
    expect(kind).toMatchSnapshot();
  });

  it('durée minimale 90s (contractions de 60s insuffisantes) (snapshot)', () => {
    const settings = { ...DEFAULT_SETTINGS, minDurationSec: 90 };
    const kind = computeThresholdBadge(REGULAR_5MIN, settings);
    expect(kind).toMatchSnapshot();
  });
});

// ============================================================
// Snapshots - formatDuration
// ============================================================

describe('Snapshot: formatDuration', () => {
  const cases = [0, 30_000, 45_000, 60_000, 90_000, 120_000, 180_000, 240_000, 300_000, 3_600_000, 7_200_000];

  for (const ms of cases) {
    it(`formatDuration(${ms}ms) (snapshot)`, () => {
      expect(formatDuration(ms)).toMatchSnapshot();
    });
  }
});

// ============================================================
// Snapshots - formatStatsClock
// ============================================================

describe('Snapshot: formatStatsClock', () => {
  const cases = [0, 30_000, 45_000, 60_000, 90_000, 120_000, 180_000, 300_000, 3_600_000];

  for (const ms of cases) {
    it(`formatStatsClock(${ms}ms) (snapshot)`, () => {
      expect(formatStatsClock(ms)).toMatchSnapshot();
    });
  }

  it('formatStatsClock(-1) retourne "—" (snapshot)', () => {
    expect(formatStatsClock(-1)).toMatchSnapshot();
  });

  it('formatStatsClock(NaN) retourne "—" (snapshot)', () => {
    expect(formatStatsClock(NaN)).toMatchSnapshot();
  });
});

// ============================================================
// Snapshots - formatContractionsPerHour
// ============================================================

describe('Snapshot: formatContractionsPerHour', () => {
  it('intervalle de 5 min → ~12/h (snapshot)', () => {
    expect(formatContractionsPerHour(5 * 60_000)).toMatchSnapshot();
  });

  it('intervalle de 10 min → ~6/h (snapshot)', () => {
    expect(formatContractionsPerHour(10 * 60_000)).toMatchSnapshot();
  });

  it('intervalle invalide (0) → "—" (snapshot)', () => {
    expect(formatContractionsPerHour(0)).toMatchSnapshot();
  });

  it('intervalle invalide (négatif) → "—" (snapshot)', () => {
    expect(formatContractionsPerHour(-1000)).toMatchSnapshot();
  });
});
