import { describe, it, expect, beforeEach } from 'vitest';
import {
  APP_ID,
  BACKUP_V0_KEY,
  SNAPSHOT_KEY,
  SNAPSHOT_VERSION,
  backupFileName,
  clearSnapshot,
  exportSnapshotJson,
  importSnapshotJson,
  loadSnapshot,
  saveSnapshot,
} from './appSnapshot';
import {
  KEY_ACTIVE_START,
  KEY_EXPORT_NUDGE_DISMISSED,
  KEY_RECORDS,
  KEY_SETTINGS,
  KEY_SNOOZE_UNTIL,
} from './legacyKeys';

beforeEach(() => {
  localStorage.clear();
});

/**
 * Le journal tel qu'il est écrit sur les téléphones AUJOURD'HUI : un tableau
 * nu sous `mc_contractions_v1`, sans enveloppe ni numéro de version. C'est la
 * seule forme que la migration 0→1 rencontrera en vrai, et c'est celle-là
 * qu'elle doit savoir relire.
 */
const JOURNAL_REEL = [
  {
    id: '0f6f2f2a-1f4b-4a1e-9a1e-2c3d4e5f6071',
    start: 1_757_140_000_000,
    end: 1_757_140_062_000,
    note: 'ballon',
    intensity: 3,
  },
  {
    id: '5b1c9d84-77aa-4f3c-8f2e-9d0a1b2c3d4e',
    start: 1_757_140_320_000,
    end: 1_757_140_375_000,
  },
];

describe('migration 0 → 1 : les clés d’aujourd’hui', () => {
  it('retrouve un `mc_contractions_v1` réel dans le nouveau magasin', () => {
    localStorage.setItem(KEY_RECORDS, JSON.stringify(JOURNAL_REEL));

    const snapshot = loadSnapshot();

    expect(snapshot.records).toEqual(JOURNAL_REEL);
  });

  it('emporte les réglages, le report d’alerte et le rappel de sauvegarde', () => {
    localStorage.setItem(KEY_RECORDS, JSON.stringify(JOURNAL_REEL));
    localStorage.setItem(
      KEY_SETTINGS,
      JSON.stringify({
        language: 'fr',
        maxIntervalMin: 4,
        maternityLabel: 'Maternité du Belvédère',
        maternityPhone: '02 32 12 34 56',
      })
    );
    localStorage.setItem(KEY_SNOOZE_UNTIL, '1757140999000');
    localStorage.setItem(KEY_EXPORT_NUDGE_DISMISSED, '1757100000000');

    const snapshot = loadSnapshot();

    expect(snapshot.settings.maxIntervalMin).toBe(4);
    expect(snapshot.settings.maternityLabel).toBe('Maternité du Belvédère');
    // Le nettoyage du numéro est celui de l'application, pas un nouveau.
    expect(snapshot.settings.maternityPhone).toBe('0232123456');
    expect(snapshot.snoozeUntil).toBe(1_757_140_999_000);
    expect(snapshot.exportNudgeDismissedAt).toBe(1_757_100_000_000);
  });

  it('emporte la contraction en cours', () => {
    const start = Date.now() - 30_000;
    localStorage.setItem(KEY_ACTIVE_START, String(start));

    expect(loadSnapshot().activeStart).toBe(start);
  });

  it('écrit l’instantané en version courante et range les octets d’origine de côté', () => {
    localStorage.setItem(KEY_RECORDS, JSON.stringify(JOURNAL_REEL));

    loadSnapshot();

    const stored = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) ?? 'null');
    expect(stored.v).toBe(SNAPSHOT_VERSION);
    expect(stored.data.app).toBe(APP_ID);

    // La copie de côté du socle tient les octets EXACTS d'avant la migration :
    // c'est elle qui rend la migration réversible à la main.
    const abri = JSON.parse(localStorage.getItem(BACKUP_V0_KEY) ?? 'null');
    expect(abri[KEY_RECORDS]).toBe(JSON.stringify(JOURNAL_REEL));
  });

  it('retire les clés héritées une fois l’instantané écrit', () => {
    localStorage.setItem(KEY_RECORDS, JSON.stringify(JOURNAL_REEL));
    localStorage.setItem(KEY_SETTINGS, JSON.stringify({ maxIntervalMin: 4 }));

    loadSnapshot();

    expect(localStorage.getItem(KEY_RECORDS)).toBeNull();
    expect(localStorage.getItem(KEY_SETTINGS)).toBeNull();
  });

  it('ne migre qu’une fois : une clé héritée réapparue n’écrase pas l’instantané', () => {
    localStorage.setItem(KEY_RECORDS, JSON.stringify(JOURNAL_REEL));
    loadSnapshot();

    // Un onglet resté ouvert sur l'ancienne version réécrit sa clé.
    localStorage.setItem(KEY_RECORDS, JSON.stringify([]));

    expect(loadSnapshot().records).toEqual(JOURNAL_REEL);
  });

  it('garde le filtre défensif : les entrées illisibles tombent, les bonnes restent', () => {
    localStorage.setItem(
      KEY_RECORDS,
      JSON.stringify([
        JOURNAL_REEL[0],
        null,
        42,
        { id: 'x', start: 100, end: 50 },
        { id: 'y', start: 100 },
      ])
    );

    expect(loadSnapshot().records).toEqual([JOURNAL_REEL[0]]);
  });

  it('ne perd rien quand la clé héritée est illisible : elle part de côté', () => {
    localStorage.setItem(KEY_RECORDS, '[{"id":"tronq');

    expect(loadSnapshot().records).toEqual([]);
    const abri = JSON.parse(localStorage.getItem(BACKUP_V0_KEY) ?? 'null');
    expect(abri[KEY_RECORDS]).toBe('[{"id":"tronq');
  });

  it('part sur un instantané vide quand rien n’a jamais été écrit', () => {
    const snapshot = loadSnapshot();

    expect(snapshot.records).toEqual([]);
    expect(snapshot.settings.maxIntervalMin).toBe(5);
    // Rien à migrer ⇒ rien à écrire : le magasin reste vierge.
    expect(localStorage.getItem(SNAPSHOT_KEY)).toBeNull();
  });
});

describe('export', () => {
  it('rend l’enveloppe `{ v, data }` du magasin', () => {
    saveSnapshot({ ...loadSnapshot(), records: JOURNAL_REEL });

    const json = exportSnapshotJson();
    expect(json).not.toBeNull();
    const parsed = JSON.parse(json as string);
    expect(parsed.v).toBe(SNAPSHOT_VERSION);
    expect(parsed.data.app).toBe(APP_ID);
    expect(parsed.data.records).toEqual(JOURNAL_REEL);
  });

  it('nomme le fichier avec la date du jour', () => {
    expect(backupFileName(new Date('2026-09-06T10:00:00Z'))).toBe(
      'miss-contraction-2026-09-06.json'
    );
  });
});

describe('import', () => {
  it('relit un fichier exporté et retrouve les contractions', () => {
    saveSnapshot({ ...loadSnapshot(), records: JOURNAL_REEL });
    const fichier = exportSnapshotJson() as string;

    clearSnapshot();
    expect(loadSnapshot().records).toEqual([]);

    const restored = importSnapshotJson(fichier);

    expect(restored.records).toEqual(JOURNAL_REEL);
    expect(loadSnapshot().records).toEqual(JOURNAL_REEL);
  });

  it('refuse le fichier d’une autre application SANS rien effacer', () => {
    saveSnapshot({ ...loadSnapshot(), records: JOURNAL_REEL });

    // Le format du squelette de la famille : même enveloppe, autre donnée.
    const autreApp = JSON.stringify({ v: 1, data: { notes: [] } });

    expect(() => importSnapshotJson(autreApp)).toThrow();
    expect(loadSnapshot().records).toEqual(JOURNAL_REEL);
  });

  it('refuse un fichier tronqué SANS rien effacer', () => {
    saveSnapshot({ ...loadSnapshot(), records: JOURNAL_REEL });

    expect(() => importSnapshotJson('{"v":1,"data":{"app"')).toThrow();
    expect(loadSnapshot().records).toEqual(JOURNAL_REEL);
  });

  it('refuse un fichier écrit par une version future SANS rien effacer', () => {
    saveSnapshot({ ...loadSnapshot(), records: JOURNAL_REEL });

    const futur = JSON.stringify({
      v: SNAPSHOT_VERSION + 1,
      data: { app: APP_ID, records: [] },
    });

    expect(() => importSnapshotJson(futur)).toThrow();
    expect(loadSnapshot().records).toEqual(JOURNAL_REEL);
  });
});

describe('effacement', () => {
  it('emporte l’instantané ET ses copies de côté', () => {
    localStorage.setItem(KEY_RECORDS, JSON.stringify(JOURNAL_REEL));
    loadSnapshot();
    expect(localStorage.getItem(BACKUP_V0_KEY)).not.toBeNull();

    clearSnapshot();

    expect(localStorage.getItem(SNAPSHOT_KEY)).toBeNull();
    expect(localStorage.getItem(BACKUP_V0_KEY)).toBeNull();
  });
});
