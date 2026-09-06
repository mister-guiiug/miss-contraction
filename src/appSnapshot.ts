/**
 * L'état de l'application sous UNE clé versionnée — et le fichier qu'on
 * emporte quand on change de téléphone.
 *
 * ── POURQUOI CE FICHIER EXISTE ───────────────────────────────────────────────
 *
 * Le `README` promettait « Export JSON — téléchargement ou partage natif de
 * l'historique et des réglages », et un bandeau revenait tous les sept jours
 * dire « Pensez à exporter une sauvegarde (Partager / Exporter) avant un
 * changement de téléphone ». Il n'existait AUCUN code d'export dans `src/` :
 * ni `downloadText`, ni `createObjectURL`, ni `Blob`. Le seul bouton que le
 * bandeau pouvait désigner n'existait pas. Sur une app qui tient des données
 * de santé sur un seul appareil, dans des heures où l'on n'a pas la tête à ça,
 * la promesse était le pire des mensonges : celui qui dissuade de recopier à
 * la main.
 *
 * ── POURQUOI UN MAGASIN VERSIONNÉ, ET PAS SEULEMENT UN BOUTON ────────────────
 *
 * Un export sans numéro de version est un fichier qu'on ne saura plus relire.
 * `createVersionedStore` du socle donne les trois choses qui manquaient : une
 * enveloppe `{ v, data }` — le format du fichier EST celui du magasin —, une
 * chaîne de migrations qui monte d'un cran à la fois, et surtout la règle sans
 * exception : AVANT toute perte possible, une copie de côté. On ne la
 * réécrit pas ici, on s'en sert.
 *
 * ── LA MIGRATION 0 → 1, ET LE CHEMIN D'ADOPTION ──────────────────────────────
 *
 * Les téléphones portent aujourd'hui cinq clés nues (`mc_contractions_v1`,
 * `mc_settings_v1`, `mc_active_start_v1`, `mc_snooze_until`,
 * `mc_export_nudge_dismissed_at`). Le socle traite une valeur d'avant
 * l'enveloppe comme une version 0 : `adoptLegacyKeys()` rassemble donc les cinq
 * clés TELLES QUELLES — les octets, pas une relecture — sous `mc_app`, et
 * laisse le magasin faire son travail : copie de côté sous
 * `mc_app.backup-v0`, migration, validation, écriture en version 1. Les clés
 * héritées ne sont retirées qu'APRÈS avoir vérifié que la version 1 est bien
 * sur le disque.
 *
 * ── LA VALIDATION EST UNE GARDE MAISON, PAS UN SCHÉMA ZOD ────────────────────
 *
 * Le socle accepte les deux (« l'app passe `schema.parse`, ou une garde
 * maison, ou rien »). Zod figure dans les dépendances mais AUCUN fichier de
 * `src/` ne l'importait : l'introduire ici ferait entrer une quinzaine de
 * kilo-octets gzip dans un bundle dont le budget est à 270 kB, pour vérifier
 * six champs. La garde ci-dessous fait exactement deux choses, et c'est tout
 * ce qu'on lui demande :
 *
 *   1. **Elle refuse ce qui n'est pas de cette application** — le champ `app`.
 *      C'est ce qui fait qu'un fichier d'une autre app de la famille est rejeté
 *      à l'import SANS QUE RIEN NE SOIT EFFACÉ : `versioned-store.import()`
 *      n'écrit que si la validation a réussi.
 *   2. **Elle répare ce qui se répare**, et c'est la lecture défensive qui
 *      existait déjà : le filtre `isRecord`, les bornes des réglages, le
 *      nettoyage du numéro de téléphone. Refuser tout un journal parce qu'une
 *      entrée sur cent est illisible serait un recul.
 *
 * La péremption à cinq minutes d'une contraction ouverte, elle, reste au
 * moment de la LECTURE (`storage.ts`) : elle dépend de l'heure qu'il est, et
 * la figer à l'écriture ressusciterait un « début » périmé au chargement
 * suivant.
 */

import { dateSlug } from '@mister-guiiug/dev-pwa-config/download';
import {
  createStore,
  readRaw,
  removeKey,
} from '@mister-guiiug/dev-pwa-config/storage';
import { createVersionedStore } from '@mister-guiiug/dev-pwa-config/versioned-store';
import {
  detectBrowserLanguage,
  isSupportedLanguage,
  type AppLanguage,
} from './i18n';
import {
  KEY_ACTIVE_START,
  KEY_EXPORT_NUDGE_DISMISSED,
  KEY_RECORDS,
  KEY_SETTINGS,
  KEY_SNOOZE_UNTIL,
  LEGACY_KEYS,
} from './legacyKeys';

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

/**
 * Tout ce que l'application garde sur l'appareil, en un objet.
 *
 * `app` n'est pas décoratif : c'est LA marque qui permet de refuser le fichier
 * d'une autre application de la famille sans avoir à deviner sa forme.
 */
export type AppSnapshot = {
  app: typeof APP_ID;
  records: ContractionRecord[];
  settings: AppSettings;
  /** Horodatage brut d'une contraction ouverte ; la péremption est lue ailleurs. */
  activeStart: number | null;
  /** Alertes suspendues jusqu'à cet horodatage (0 = pas de report). */
  snoozeUntil: number;
  /** Dernier « Plus tard » du bandeau de sauvegarde (0 = jamais). */
  exportNudgeDismissedAt: number;
};

export const APP_ID = 'miss-contraction';

/** La version du format. Toute rupture ajoute une migration, jamais un `if`. */
export const SNAPSHOT_VERSION = 1;

const STORE_PREFIX = 'mc_';
const STORE_KEY = 'app';

/** La clé `localStorage` réelle de l'instantané — pour les tests et le harnais. */
export const SNAPSHOT_KEY = `${STORE_PREFIX}${STORE_KEY}`;

/** La copie de côté que le socle écrit avant la migration 0 → 1. */
export const BACKUP_V0_KEY = `${SNAPSHOT_KEY}.backup-v0`;

const DEFAULT_SETTINGS: AppSettings = {
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

export function defaultSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS };
}

/**
 * Ne garde que ce qui se compose : chiffres et `+`.
 *
 * Exportée parce que l'écran « Maternité » enregistre lui-même le numéro
 * quand il manque. Deux nettoyages écrits séparément finiraient par diverger,
 * et c'est le numéro qu'on appelle en urgence.
 */
export function sanitizePhone(s: string): string {
  return s.replace(/[^\d+]/g, '').slice(0, 20);
}

function sanitizeMaternityAddress(s: string): string {
  return s.replace(/\r\n/g, '\n').trim().slice(0, 800);
}

function sanitizeMaternityLabel(s: string): string {
  return s.replace(/\s+/g, ' ').trim().slice(0, 120);
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

function parseStatsWindow(v: unknown): StatsWindowKey {
  if (v === '30' || v === '60' || v === '120' || v === 'all') return v;
  return DEFAULT_SETTINGS.statsWindowMinutes;
}

export function isRecord(x: unknown): x is ContractionRecord {
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

/**
 * Les réglages, bornés et nettoyés. C'est le `loadSettings` d'avant, déplacé
 * du moment de la lecture à celui de la validation : une valeur hors bornes
 * ne doit pas se ranger dans l'instantané, ni voyager dans un fichier.
 */
export function normalizeSettings(value: unknown): AppSettings {
  const o: Record<string, unknown> =
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const moduleVoiceCommands =
    typeof o.moduleVoiceCommands === 'boolean'
      ? o.moduleVoiceCommands
      : DEFAULT_SETTINGS.moduleVoiceCommands;

  const voiceCommandsEnabled =
    moduleVoiceCommands && typeof o.voiceCommandsEnabled === 'boolean'
      ? o.voiceCommandsEnabled
      : false;

  return {
    language: isSupportedLanguage(o.language)
      ? o.language
      : DEFAULT_SETTINGS.language,
    maxIntervalMin: clampNum(
      o.maxIntervalMin,
      1,
      30,
      DEFAULT_SETTINGS.maxIntervalMin
    ),
    minDurationSec: clampNum(
      o.minDurationSec,
      10,
      180,
      DEFAULT_SETTINGS.minDurationSec
    ),
    consecutiveCount: clampNum(
      o.consecutiveCount,
      2,
      12,
      DEFAULT_SETTINGS.consecutiveCount
    ),
    notificationsEnabled: Boolean(o.notificationsEnabled),
    statsWindowMinutes: parseStatsWindow(o.statsWindowMinutes),
    preAlertEnabled:
      typeof o.preAlertEnabled === 'boolean'
        ? o.preAlertEnabled
        : DEFAULT_SETTINGS.preAlertEnabled,
    openContractionReminderMin: clampNum(
      o.openContractionReminderMin,
      2,
      30,
      DEFAULT_SETTINGS.openContractionReminderMin
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
        : DEFAULT_SETTINGS.largeMode,
    keepAwakeDuringContraction:
      typeof o.keepAwakeDuringContraction === 'boolean'
        ? o.keepAwakeDuringContraction
        : DEFAULT_SETTINGS.keepAwakeDuringContraction,
    vibrationEnabled:
      typeof o.vibrationEnabled === 'boolean'
        ? o.vibrationEnabled
        : DEFAULT_SETTINGS.vibrationEnabled,
    voiceAnnounceDuration:
      typeof o.voiceAnnounceDuration === 'boolean'
        ? o.voiceAnnounceDuration
        : DEFAULT_SETTINGS.voiceAnnounceDuration,
    voiceCommandsEnabled,
    moduleVoiceCommands,
    moduleMaternityMessage:
      typeof o.moduleMaternityMessage === 'boolean'
        ? o.moduleMaternityMessage
        : DEFAULT_SETTINGS.moduleMaternityMessage,
  };
}

/** Un horodatage exploitable, ou `null`. Le futur et le négatif ne le sont pas. */
function readTimestamp(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v;
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Un horodatage exploitable, ou `0` — pour les champs qui n'admettent pas `null`. */
function readMs(v: unknown): number {
  return readTimestamp(v) ?? 0;
}

/**
 * LA GARDE. Refuse ce qui n'est pas de cette application ; répare le reste.
 *
 * Elle est appelée par le magasin au chargement ET à l'import : c'est le même
 * verdict des deux côtés, ce qui est exactement l'intérêt d'un format de
 * fichier identique au format du magasin.
 */
export function parseSnapshot(data: unknown): AppSnapshot {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('Sauvegarde illisible : la donnée n’est pas un objet.');
  }
  const o = data as Record<string, unknown>;
  if (o.app !== APP_ID) {
    throw new Error(
      `Sauvegarde d’une autre application (« ${String(o.app ?? 'sans nom')} »).`
    );
  }
  return {
    app: APP_ID,
    records: Array.isArray(o.records) ? o.records.filter(isRecord) : [],
    settings: normalizeSettings(o.settings),
    activeStart: readTimestamp(o.activeStart),
    snoozeUntil: readMs(o.snoozeUntil),
    exportNudgeDismissedAt: readMs(o.exportNudgeDismissedAt),
  };
}

/**
 * La version 0, c'est-à-dire les cinq clés nues, telles qu'elles dorment sur
 * les téléphones : `{ 'mc_contractions_v1': '<octets>', … }`.
 *
 * ELLE LÈVE PLUTÔT QUE DE RENDRE UN INSTANTANÉ VIDE, et ce n'est pas un détail
 * de style. Un fichier `{ "v": 0, "data": … }` fabriqué à la main passerait
 * aussi par ici : rendre « rien » pour une donnée incomprise ferait ACCEPTER
 * l'import et effacerait le journal. En levant, `versioned-store.import()`
 * refuse le fichier et ne touche à rien ; au chargement, le socle range les
 * octets de côté et repart du seed.
 */
function migrateFromLegacyKeys(data: unknown): AppSnapshot {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('Version 0 : la donnée n’est pas un jeu de clés héritées.');
  }
  const bundle = data as Record<string, unknown>;
  const known = LEGACY_KEYS.filter(key => typeof bundle[key] === 'string');
  if (known.length === 0) {
    throw new Error('Version 0 : aucune clé héritée reconnue.');
  }

  const parse = <T>(raw: unknown, fallback: T): T | unknown => {
    if (typeof raw !== 'string') return fallback;
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      // Tronquée par un onglet tué : la garde plus bas s'en accommode, et les
      // octets d'origine sont déjà sous `mc_app.backup-v0`.
      return fallback;
    }
  };

  return parseSnapshot({
    app: APP_ID,
    records: parse(bundle[KEY_RECORDS], []),
    settings: parse(bundle[KEY_SETTINGS], {}),
    activeStart: readTimestamp(bundle[KEY_ACTIVE_START]),
    snoozeUntil: readMs(bundle[KEY_SNOOZE_UNTIL]),
    exportNudgeDismissedAt: readMs(bundle[KEY_EXPORT_NUDGE_DISMISSED]),
  });
}

const store = createStore(STORE_PREFIX);

const versioned = createVersionedStore<AppSnapshot>({
  store,
  key: STORE_KEY,
  version: SNAPSHOT_VERSION,
  migrations: { 0: migrateFromLegacyKeys },
  validate: parseSnapshot,
  seed: (): AppSnapshot => ({
    app: APP_ID,
    records: [],
    settings: defaultSettings(),
    activeStart: null,
    snoozeUntil: 0,
    exportNudgeDismissedAt: 0,
  }),
});

/**
 * Le chemin d'adoption : les cinq clés héritées deviennent une version 0.
 *
 * Vérifié à CHAQUE lecture plutôt que mémorisé dans un drapeau de module :
 * un drapeau survit à un `localStorage.clear()` (les tests) et à un second
 * onglet resté sur l'ancienne version, et ferait alors sauter la migration en
 * silence. Une lecture de clé absente coûte moins qu'un journal perdu.
 */
function adoptLegacyKeys(): void {
  const bundle: Record<string, string> = {};
  for (const key of LEGACY_KEYS) {
    const raw = readRaw(key);
    if (raw !== null) bundle[key] = raw;
  }
  if (Object.keys(bundle).length === 0) return;
  if (!store.setRaw(STORE_KEY, JSON.stringify(bundle))) return;

  // C'est ce `load()` qui fait le travail du socle : copie de côté sous
  // `mc_app.backup-v0`, migration 0 → 1, validation, écriture.
  versioned.load();

  // Les clés héritées ne partent QUE si la version 1 est réellement sur le
  // disque. Une migration qui a échoué laisse tout en place, sous `mc_app` et
  // dans la copie de côté : rien n'est perdu, et l'on peut revenir dessus.
  const persisted = store.get<{ v?: number } | null>(STORE_KEY, null);
  if (persisted?.v !== SNAPSHOT_VERSION) return;
  for (const key of LEGACY_KEYS) removeKey(key);
}

/** L'état complet, migré et validé. Jamais `null` : le seed répond toujours. */
export function loadSnapshot(): AppSnapshot {
  if (store.getRaw(STORE_KEY) === null) adoptLegacyKeys();
  return versioned.load();
}

/** Écrit l'instantané complet. `false` si le stockage a refusé (mode privé, quota). */
export function saveSnapshot(snapshot: AppSnapshot): boolean {
  return versioned.save(snapshot);
}

/** Lit, applique le correctif, réécrit. Le chemin de toutes les écritures. */
export function updateSnapshot(patch: Partial<AppSnapshot>): AppSnapshot {
  const next: AppSnapshot = { ...loadSnapshot(), ...patch, app: APP_ID };
  saveSnapshot(next);
  return next;
}

/** Efface l'instantané ET ses copies de côté. Le thème et le reste survivent. */
export function clearSnapshot(): void {
  versioned.clear();
}

/**
 * Le fichier de sauvegarde : l'enveloppe `{ v, data }`, indentée.
 *
 * L'adoption est forcée d'abord, sans quoi une utilisatrice qui exporte avant
 * d'avoir rien touché depuis la mise à jour exporterait un instantané vide.
 */
export function exportSnapshotJson(): string | null {
  loadSnapshot();
  return versioned.export();
}

/**
 * Relit un fichier de sauvegarde. Lève un message lisible si le fichier n'est
 * pas de cette application, est tronqué, ou vient d'une version plus récente —
 * et dans ces trois cas, RIEN n'est écrit.
 */
export function importSnapshotJson(json: string): AppSnapshot {
  // Adoption d'abord : sans elle, un import réussi laisserait les cinq clés
  // héritées derrière lui, prêtes à ressusciter au prochain chargement.
  loadSnapshot();
  return versioned.import(json);
}

/** `miss-contraction-2026-09-06.json` — la date que la sage-femme lira. */
export function backupFileName(date?: Date): string {
  return `${APP_ID}-${dateSlug(date)}.json`;
}
