export type StatsWindowKey = 'all' | '30' | '60' | '120';

import {
  detectBrowserLanguage,
  isSupportedLanguage,
  type AppLanguage,
} from './i18n';

export type ContractionRecord = {
  id: string;
  start: number;
  end: number;
  /** Note libre (optionnelle), ex. contexte. */
  note?: string;
  /** Intensité de la douleur (1 à 5). */
  intensity?: number;
};

export type AppSettings = {
  language: AppLanguage;
  maxIntervalMin: number;
  minDurationSec: number;
  consecutiveCount: number;
  notificationsEnabled: boolean;
  /** Fenêtre pour stats et graphique : toutes les données ou N dernières minutes. */
  statsWindowMinutes: StatsWindowKey;
  /** Notification « rythme soutenu » avant le seuil strict. */
  preAlertEnabled: boolean;
  /** Rappel si « début » sans « fin » après N minutes (2–30). */
  openContractionReminderMin: number;
  /** Nom affiché (ex. maternité, service). */
  maternityLabel: string;
  /** Numéro maternité pour appel rapide (chiffres et +). */
  maternityPhone: string;
  /** Adresse ou consignes d’accès (affichée sur la page maternité). */
  maternityAddress: string;
  /** Textes et boutons plus grands. */
  largeMode: boolean;
  /** Garder l’écran allumé pendant une contraction en cours. */
  keepAwakeDuringContraction: boolean;
  /** Vibrations courtes au début / fin (si supporté). */
  vibrationEnabled: boolean;
  /** Annoncer la durée de la contraction vocalement à la fin. */
  voiceAnnounceDuration: boolean;
  /** Commande vocale expérimentale (début / fin). */
  voiceCommandsEnabled: boolean;
  /** Afficher le module commande vocale (menu / réglages / bouton). */
  moduleVoiceCommands: boolean;
  /** Afficher l’écran « message maternité » et l’entrée du menu. */
  moduleMaternityMessage: boolean;
};

/*
 * LES CLÉS SONT TOUTES EXPORTÉES, ET C'EST LE HARNAIS E2E QUI L'A EXIGÉ.
 * Trois d'entre elles étaient privées, alors que les tests de bout en bout
 * doivent semer et relire `localStorage`. Ils en tenaient donc leur propre
 * copie — `mc_records`, `mc_settings`, `mc_snooze_until_ms` — dont AUCUNE ne
 * correspondait à la vraie clé. Quarante-deux occurrences écrivaient et
 * relisaient un stockage que l'application n'a jamais lu. Une seule
 * définition ferme la porte.
 */
export const KEY_RECORDS = 'mc_contractions_v1';
export const KEY_SETTINGS = 'mc_settings_v1';
export const KEY_ACTIVE_START = 'mc_active_start_v1';
export const KEY_SNOOZE_UNTIL = 'mc_snooze_until';
export const KEY_EXPORT_NUDGE_DISMISSED = 'mc_export_nudge_dismissed_at';

const defaultSettings: AppSettings = {
  language: detectBrowserLanguage(),
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
  voiceAnnounceDuration: false,
  voiceCommandsEnabled: false,
  moduleVoiceCommands: true,
  moduleMaternityMessage: true,
};

export function loadRecords(): ContractionRecord[] {
  try {
    const raw = localStorage.getItem(KEY_RECORDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord);
  } catch {
    return [];
  }
}

export function saveRecords(records: ContractionRecord[]): void {
  localStorage.setItem(KEY_RECORDS, JSON.stringify(records));
}

/**
 * Au-delà de ce délai, un « début » retrouvé au démarrage n'est plus une
 * contraction en cours : c'est un « fin » jamais appuyé.
 *
 * L'ASYMÉTRIE DICTE LA VALEUR. Ne pas restaurer une contraction légitime
 * ramène au comportement d'avant : la contraction est perdue, comme elle
 * l'était à chaque rechargement. En restaurer une périmée est PIRE : au
 * prochain appui sur « Fin », l'app enregistre une contraction de plusieurs
 * minutes, qui fausse les statistiques et le seuil d'alerte maternité. Dans le
 * doute, on jette.
 *
 * Cinq minutes : très au-dessus de la plus longue contraction réelle (deux à
 * trois minutes en fin de travail), et cohérent avec le réglage
 * `openContractionReminderMin` (défaut 4 min), la borne que l'app se donne
 * déjà pour juger suspect un « début » resté ouvert. Une constante, et non ce
 * réglage : il monte jusqu'à 30 minutes, ce qui rouvrirait le mauvais côté de
 * l'asymétrie.
 */
export const ACTIVE_START_MAX_AGE_MS = 5 * 60_000;

/**
 * Horodatage de la contraction en cours de chronométrage, ou `null`.
 *
 * Écarte silencieusement une valeur illisible, future (horloge reculée) ou
 * plus vieille que `ACTIVE_START_MAX_AGE_MS`.
 */
export function loadActiveStart(now: number = Date.now()): number | null {
  try {
    const raw = localStorage.getItem(KEY_ACTIVE_START);
    if (!raw) return null;
    const start = Number(raw);
    if (!Number.isFinite(start) || start <= 0) return null;
    if (start > now) return null;
    if (now - start > ACTIVE_START_MAX_AGE_MS) return null;
    return start;
  } catch {
    return null;
  }
}

export function saveActiveStart(start: number | null): void {
  if (start === null) {
    localStorage.removeItem(KEY_ACTIVE_START);
    return;
  }
  localStorage.setItem(KEY_ACTIVE_START, String(start));
}

function parseStatsWindow(v: unknown): StatsWindowKey {
  if (v === '30' || v === '60' || v === '120' || v === 'all') return v;
  return defaultSettings.statsWindowMinutes;
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    if (!raw) return { ...defaultSettings };
    const o = JSON.parse(raw) as Partial<AppSettings>;
    const moduleVoiceCommands =
      typeof o.moduleVoiceCommands === 'boolean'
        ? o.moduleVoiceCommands
        : defaultSettings.moduleVoiceCommands;

    const voiceCommandsEnabled =
      moduleVoiceCommands && typeof o.voiceCommandsEnabled === 'boolean'
        ? o.voiceCommandsEnabled
        : false;

    return {
      language: isSupportedLanguage(o.language)
        ? o.language
        : defaultSettings.language,
      maxIntervalMin: clampNum(
        o.maxIntervalMin,
        1,
        30,
        defaultSettings.maxIntervalMin
      ),
      minDurationSec: clampNum(
        o.minDurationSec,
        10,
        180,
        defaultSettings.minDurationSec
      ),
      consecutiveCount: clampNum(
        o.consecutiveCount,
        2,
        12,
        defaultSettings.consecutiveCount
      ),
      notificationsEnabled: Boolean(o.notificationsEnabled),
      statsWindowMinutes: parseStatsWindow(o.statsWindowMinutes),
      preAlertEnabled:
        typeof o.preAlertEnabled === 'boolean'
          ? o.preAlertEnabled
          : defaultSettings.preAlertEnabled,
      openContractionReminderMin: clampNum(
        o.openContractionReminderMin,
        2,
        30,
        defaultSettings.openContractionReminderMin
      ),
      maternityLabel:
        typeof o.maternityLabel === 'string'
          ? sanitizeMaternityLabel(o.maternityLabel)
          : '',
      maternityPhone:
        typeof o.maternityPhone === 'string'
          ? sanitizePhone(o.maternityPhone)
          : '',
      maternityAddress:
        typeof o.maternityAddress === 'string'
          ? sanitizeMaternityAddress(o.maternityAddress)
          : '',
      largeMode:
        typeof o.largeMode === 'boolean'
          ? o.largeMode
          : defaultSettings.largeMode,
      keepAwakeDuringContraction:
        typeof o.keepAwakeDuringContraction === 'boolean'
          ? o.keepAwakeDuringContraction
          : defaultSettings.keepAwakeDuringContraction,
      vibrationEnabled:
        typeof o.vibrationEnabled === 'boolean'
          ? o.vibrationEnabled
          : defaultSettings.vibrationEnabled,
      voiceAnnounceDuration:
        typeof o.voiceAnnounceDuration === 'boolean'
          ? o.voiceAnnounceDuration
          : defaultSettings.voiceAnnounceDuration,
      voiceCommandsEnabled,
      moduleVoiceCommands,
      moduleMaternityMessage:
        typeof o.moduleMaternityMessage === 'boolean'
          ? o.moduleMaternityMessage
          : defaultSettings.moduleMaternityMessage,
    };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(s: AppSettings): void {
  localStorage.setItem(KEY_SETTINGS, JSON.stringify(s));
}

function sanitizePhone(s: string): string {
  return s.replace(/[^\d+]/g, '').slice(0, 20);
}

function sanitizeMaternityAddress(s: string): string {
  return s.replace(/\r\n/g, '\n').trim().slice(0, 800);
}

function sanitizeMaternityLabel(s: string): string {
  return s.replace(/\s+/g, ' ').trim().slice(0, 120);
}

function isRecord(x: unknown): x is ContractionRecord {
  if (typeof x !== 'object' || x === null) return false;
  const r = x as ContractionRecord;
  if (
    typeof r.id !== 'string' ||
    typeof r.start !== 'number' ||
    typeof r.end !== 'number' ||
    r.end < r.start
  )
    return false;
  if (r.note !== undefined && typeof r.note !== 'string') return false;
  if (
    r.intensity !== undefined &&
    (typeof r.intensity !== 'number' || r.intensity < 1 || r.intensity > 5)
  )
    return false;
  return true;
}

function clampNum(
  v: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return Math.min(max, Math.max(min, n));
}

export function loadSnoozeUntil(): number {
  try {
    const t = Number(localStorage.getItem(KEY_SNOOZE_UNTIL));
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

export function setSnoozeUntilMs(ms: number): void {
  localStorage.setItem(KEY_SNOOZE_UNTIL, String(ms));
}

export function clearSnoozeUntil(): void {
  localStorage.removeItem(KEY_SNOOZE_UNTIL);
}
