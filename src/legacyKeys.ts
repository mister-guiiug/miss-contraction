/**
 * Les cinq clés `localStorage` d'avant le magasin versionné.
 *
 * ELLES NE SONT PLUS ÉCRITES, ET C'EST TOUT L'INTÉRÊT DE CE FICHIER. Depuis
 * l'adoption de `createVersionedStore`, l'application tient son état sous une
 * SEULE clé enveloppée (`mc_app`, cf. `appSnapshot.ts`). Ces cinq-ci restent
 * la forme qui dort sur les téléphones : la migration 0 → 1 les lit une fois,
 * puis les retire — après que le socle en a rangé les octets de côté.
 *
 * ISOLÉES DANS LEUR PROPRE MODULE pour une raison de dépendances, pas de
 * style : `appSnapshot.ts` en a besoin pour migrer, et `storage.ts` — qui
 * importe `appSnapshot.ts` — les réexporte pour le harnais de bout en bout,
 * qui sème encore la forme héritée pour éprouver la migration. Les laisser
 * dans `storage.ts` fermait le cycle.
 */

export const KEY_RECORDS = 'mc_contractions_v1';
export const KEY_SETTINGS = 'mc_settings_v1';
export const KEY_ACTIVE_START = 'mc_active_start_v1';
export const KEY_SNOOZE_UNTIL = 'mc_snooze_until';
export const KEY_EXPORT_NUDGE_DISMISSED = 'mc_export_nudge_dismissed_at';

/** Lues dans cet ordre par la migration ; retirées dans cet ordre après elle. */
export const LEGACY_KEYS = [
  KEY_RECORDS,
  KEY_SETTINGS,
  KEY_ACTIVE_START,
  KEY_SNOOZE_UNTIL,
  KEY_EXPORT_NUDGE_DISMISSED,
] as const;
