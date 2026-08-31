import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSettings,
  saveSettings,
  loadRecords,
  saveRecords,
  loadActiveStart,
  saveActiveStart,
  ACTIVE_START_MAX_AGE_MS,
  KEY_ACTIVE_START,
} from './storage';
import type { ContractionRecord } from './storage';

beforeEach(() => {
  localStorage.clear();
});

describe('loadSettings', () => {
  it('retourne les valeurs par défaut si rien en localStorage', () => {
    const s = loadSettings();
    expect(s.maxIntervalMin).toBe(5);
    expect(s.minDurationSec).toBe(45);
    expect(s.consecutiveCount).toBe(3);
    expect(s.moduleMaternityMessage).toBe(true);
    expect(s.statsWindowMinutes).toBe('all');
  });

  it('fusionne les valeurs stockées avec les valeurs par défaut', () => {
    localStorage.setItem(
      'mc_settings_v1',
      JSON.stringify({ maxIntervalMin: 10 })
    );
    const s = loadSettings();
    expect(s.maxIntervalMin).toBe(10);
    expect(s.minDurationSec).toBe(45); // valeur par défaut conservée
  });

  it('clampe les valeurs hors plage (max 30)', () => {
    localStorage.setItem(
      'mc_settings_v1',
      JSON.stringify({ maxIntervalMin: 999 })
    );
    const s = loadSettings();
    expect(s.maxIntervalMin).toBe(30);
  });

  it('clampe les valeurs hors plage (min 1)', () => {
    localStorage.setItem(
      'mc_settings_v1',
      JSON.stringify({ maxIntervalMin: 0 })
    );
    const s = loadSettings();
    expect(s.maxIntervalMin).toBe(1);
  });

  it('ne plante pas et retourne les valeurs par défaut si JSON invalide', () => {
    localStorage.setItem('mc_settings_v1', 'invalid{json');
    expect(() => loadSettings()).not.toThrow();
    const s = loadSettings();
    expect(s.maxIntervalMin).toBe(5);
  });

  it('force voiceCommandsEnabled à false quand moduleVoiceCommands est false', () => {
    localStorage.setItem(
      'mc_settings_v1',
      JSON.stringify({
        moduleVoiceCommands: false,
        voiceCommandsEnabled: true,
      })
    );

    const s = loadSettings();
    expect(s.moduleVoiceCommands).toBe(false);
    expect(s.voiceCommandsEnabled).toBe(false);
  });
});

describe('saveSettings / loadSettings (aller-retour)', () => {
  it('persiste et relit les paramètres', () => {
    const s = loadSettings();
    s.maxIntervalMin = 8;
    s.maternityLabel = 'CHU Nantes';
    saveSettings(s);
    const loaded = loadSettings();
    expect(loaded.maxIntervalMin).toBe(8);
    expect(loaded.maternityLabel).toBe('CHU Nantes');
  });
});

describe('loadRecords / saveRecords', () => {
  it('retourne [] si localStorage vide', () => {
    expect(loadRecords()).toEqual([]);
  });

  it('persiste et relit les enregistrements', () => {
    const records: ContractionRecord[] = [
      { id: 'a1', start: 1000, end: 2000 },
      { id: 'a2', start: 3000, end: 4000, note: 'intense' },
    ];
    saveRecords(records);
    const loaded = loadRecords();
    expect(loaded).toHaveLength(2);
    expect(loaded[0]?.id).toBe('a1');
    expect(loaded[1]?.note).toBe('intense');
  });

  it('retourne [] si JSON invalide', () => {
    localStorage.setItem('mc_contractions_v1', 'bad-json');
    expect(loadRecords()).toEqual([]);
  });

  it('filtre les entrées invalides (null, nombre, end < start)', () => {
    localStorage.setItem(
      'mc_contractions_v1',
      JSON.stringify([
        null,
        42,
        { id: 'ok', start: 1000, end: 2000 },
        { id: 'bad-end', start: 5000, end: 4000 }, // end < start
      ])
    );
    const loaded = loadRecords();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.id).toBe('ok');
  });
});

/**
 * La contraction en cours de chronométrage, seule donnée de l'app qui ne
 * survivait à aucun rechargement — y compris celui que `virtual:pwa-register`
 * déclenche seul, en `registerType: 'autoUpdate'`, quand un déploiement
 * atterrit.
 *
 * Tout tient dans l'asymétrie des deux erreurs possibles. Jeter une
 * contraction légitime rend le comportement d'avant : elle est perdue.
 * Restaurer une contraction périmée est PIRE : le prochain « Fin » écrit un
 * enregistrement de plusieurs minutes dans l'historique, qui fausse les
 * statistiques et le seuil d'alerte. Ces tests verrouillent le côté prudent.
 */
describe('loadActiveStart / saveActiveStart', () => {
  const NOW = 1_700_000_000_000;

  it('retourne null si rien en localStorage', () => {
    expect(loadActiveStart(NOW)).toBeNull();
  });

  it('restaure une contraction commencée il y a quelques secondes', () => {
    saveActiveStart(NOW - 20_000);
    expect(loadActiveStart(NOW)).toBe(NOW - 20_000);
  });

  it('restaure encore juste avant le seuil', () => {
    saveActiveStart(NOW - ACTIVE_START_MAX_AGE_MS + 1);
    expect(loadActiveStart(NOW)).toBe(NOW - ACTIVE_START_MAX_AGE_MS + 1);
  });

  it('jette un « début » plus vieux que le seuil', () => {
    // Un « fin » jamais appuyé, pas une contraction en cours : le restaurer
    // fabriquerait un enregistrement de plus de cinq minutes.
    saveActiveStart(NOW - ACTIVE_START_MAX_AGE_MS - 1);
    expect(loadActiveStart(NOW)).toBeNull();
  });

  it('jette un horodatage futur (horloge reculée)', () => {
    // Sinon le minuteur afficherait un temps écoulé négatif.
    saveActiveStart(NOW + 60_000);
    expect(loadActiveStart(NOW)).toBeNull();
  });

  it('jette une valeur illisible sans lever', () => {
    localStorage.setItem(KEY_ACTIVE_START, 'pas-un-nombre');
    expect(() => loadActiveStart(NOW)).not.toThrow();
    expect(loadActiveStart(NOW)).toBeNull();
  });

  it('efface la clé quand la contraction se termine', () => {
    saveActiveStart(NOW - 20_000);
    saveActiveStart(null);
    expect(localStorage.getItem(KEY_ACTIVE_START)).toBeNull();
    expect(loadActiveStart(NOW)).toBeNull();
  });
});
