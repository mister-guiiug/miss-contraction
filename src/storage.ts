export type StatsWindowKey = 'all' | '30' | '60' | '120';

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
  /** Commande vocale expérimentale (début / fin). */
  voiceCommandsEnabled: boolean;
  /** Afficher le module commande vocale (menu / réglages / bouton). */
  moduleVoiceCommands: boolean;
  /** Afficher l’écran « message maternité » et l’entrée du menu. */
  moduleMaternityMessage: boolean;
};

const KEY_RECORDS = 'mc_contractions_v1';
const KEY_SETTINGS = 'mc_settings_v1';

export const KEY_SNOOZE_UNTIL = 'mc_snooze_until';
export const KEY_EXPORT_NUDGE_DISMISSED = 'mc_export_nudge_dismissed_at';

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

function parseStatsWindow(v: unknown): StatsWindowKey {
  if (v === '30' || v === '60' || v === '120' || v === 'all') return v;
  return defaultSettings.statsWindowMinutes;
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY_SETTINGS);
    if (!raw) return { ...defaultSettings };
    const o = JSON.parse(raw) as Partial<AppSettings>;
    return {
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
      voiceCommandsEnabled:
        typeof o.voiceCommandsEnabled === 'boolean'
          ? o.voiceCommandsEnabled
          : defaultSettings.voiceCommandsEnabled,
      moduleVoiceCommands:
        typeof o.moduleVoiceCommands === 'boolean'
          ? o.moduleVoiceCommands
          : defaultSettings.moduleVoiceCommands,
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
