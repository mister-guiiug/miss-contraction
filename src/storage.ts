/**
 * La façade de persistance de l'application.
 *
 * ELLE N'ÉCRIT PLUS DANS `localStorage` DIRECTEMENT. Sous elle, un seul
 * instantané versionné (`appSnapshot.ts`, clé `mc_app`, enveloppe `{ v, data }`)
 * remplace les cinq clés nues d'avant — lesquelles n'avaient ni schéma, ni
 * numéro de version, ni chaîne de migration. La migration 0 → 1 les relit une
 * fois et les retire, après que le socle en a rangé les octets de côté.
 *
 * POURQUOI GARDER CETTE FAÇADE plutôt que d'appeler l'instantané partout :
 * dix-huit fichiers importent `./storage`, et le harnais de bout en bout
 * importe ses clés d'ici. Les signatures ne bougent pas ; seuls les octets
 * derrière elles changent. Un renommage de plus n'aurait rien prouvé.
 *
 * CE QUI RESTE AU MOMENT DE LA LECTURE, et pas à celui de l'écriture : la
 * péremption d'une contraction ouverte. Elle dépend de l'heure qu'il est.
 */

import {
  loadSnapshot,
  updateSnapshot,
  type AppSettings,
  type AppSnapshot,
  type ContractionRecord,
  type StatsWindowKey,
} from './appSnapshot';

export type { AppSettings, AppSnapshot, ContractionRecord, StatsWindowKey };

export {
  APP_ID,
  BACKUP_V0_KEY,
  SNAPSHOT_KEY,
  SNAPSHOT_VERSION,
  backupFileName,
  clearSnapshot,
  defaultSettings,
  exportSnapshotJson,
  importSnapshotJson,
  loadSnapshot,
  saveSnapshot,
  sanitizePhone,
  updateSnapshot,
} from './appSnapshot';

/*
 * LES CLÉS HÉRITÉES SONT TOUJOURS EXPORTÉES, ET C'EST TOUJOURS LE HARNAIS E2E
 * QUI L'EXIGE. Elles ne désignent plus ce que l'application écrit — elles
 * désignent ce qu'elle SAIT RELIRE. Le harnais sème cette forme-là, puis
 * recharge : il éprouve donc la migration en même temps que l'écran.
 */
export {
  KEY_ACTIVE_START,
  KEY_EXPORT_NUDGE_DISMISSED,
  KEY_RECORDS,
  KEY_SETTINGS,
  KEY_SNOOZE_UNTIL,
  LEGACY_KEYS,
} from './legacyKeys';

export function loadRecords(): ContractionRecord[] {
  return loadSnapshot().records;
}

export function saveRecords(records: ContractionRecord[]): void {
  updateSnapshot({ records });
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
 * Écarte silencieusement une valeur future (horloge reculée) ou plus vieille
 * que `ACTIVE_START_MAX_AGE_MS`. Le tri des valeurs illisibles, lui, a
 * remonté d'un cran : c'est la garde de l'instantané qui le fait désormais.
 */
export function loadActiveStart(now: number = Date.now()): number | null {
  const start = loadSnapshot().activeStart;
  if (start === null) return null;
  if (start > now) return null;
  if (now - start > ACTIVE_START_MAX_AGE_MS) return null;
  return start;
}

export function saveActiveStart(start: number | null): void {
  updateSnapshot({ activeStart: start });
}

export function loadSettings(): AppSettings {
  return loadSnapshot().settings;
}

export function saveSettings(s: AppSettings): void {
  updateSnapshot({ settings: s });
}

export function loadSnoozeUntil(): number {
  return loadSnapshot().snoozeUntil;
}

export function setSnoozeUntilMs(ms: number): void {
  updateSnapshot({ snoozeUntil: ms });
}

export function clearSnoozeUntil(): void {
  updateSnapshot({ snoozeUntil: 0 });
}

/** Dernier « Plus tard » du bandeau de sauvegarde ; `0` s'il n'a jamais été fermé. */
export function loadExportNudgeDismissedAt(): number {
  return loadSnapshot().exportNudgeDismissedAt;
}

export function setExportNudgeDismissedAt(ms: number): void {
  updateSnapshot({ exportNudgeDismissedAt: ms });
}
