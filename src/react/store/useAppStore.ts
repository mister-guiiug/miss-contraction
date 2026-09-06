/**
 * Store Zustand pour l'état global de l'application
 * Pont entre le monde React et le code vanilla existant
 */

import { create } from 'zustand';
import type {
  AppSettings,
  AppSnapshot,
  ContractionRecord,
} from '../../storage';
import {
  loadSettings,
  saveSettings,
  loadRecords,
  saveRecords,
  loadActiveStart,
  saveActiveStart,
  SNAPSHOT_KEY,
} from '../../storage';

interface AppState {
  // État
  records: ContractionRecord[];
  settings: AppSettings;
  activeStart: number | null;
  alertLatch: boolean;

  // Actions
  setRecords: (records: ContractionRecord[]) => void;
  addRecord: (record: ContractionRecord) => void;
  updateRecord: (id: string, updates: Partial<ContractionRecord>) => void;
  deleteRecord: (id: string) => void;
  clearRecords: () => void;

  updateSettings: (settings: Partial<AppSettings>) => void;
  saveSettings: () => void;

  /**
   * Recharger l'écran depuis un instantané qui vient d'être ÉCRIT (import).
   *
   * Il ne persiste rien : `importSnapshotJson` a déjà écrit, et valider deux
   * fois la même donnée ferait diverger ce que l'écran montre de ce que le
   * disque contient si la garde répare quelque chose au passage.
   */
  adoptSnapshot: (snapshot: AppSnapshot) => void;

  startContraction: () => void;
  endContraction: (note?: string, intensity?: number) => void;

  setAlertLatch: (latched: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // État initial - chargé depuis localStorage
  records: loadRecords(),
  settings: loadSettings(),
  // La contraction en cours survit au rechargement. Elle ne le faisait pas, et
  // l'app était en `registerType: 'autoUpdate'` : le module `virtual:pwa-register`
  // appelait `window.location.reload()` de lui-même quand un nouveau service
  // worker s'activait. Un déploiement tombant pendant un chronométrage — pendant
  // un accouchement — le faisait disparaître en silence. Depuis le 02/09/2026
  // l'app est en `prompt` (l'utilisatrice recharge quand elle veut) ; la
  // persistance reste : un rechargement volontaire ne doit rien perdre non plus.
  activeStart: loadActiveStart(),
  alertLatch: false,

  // Actions
  setRecords: records => {
    set({ records });
    saveRecords(records);
  },

  addRecord: record => {
    const newRecords = [...get().records, record];
    set({ records: newRecords });
    saveRecords(newRecords);
  },

  updateRecord: (id, updates) => {
    const newRecords = get().records.map(r =>
      r.id === id ? { ...r, ...updates } : r
    );
    set({ records: newRecords });
    saveRecords(newRecords);
  },

  deleteRecord: id => {
    const newRecords = get().records.filter(r => r.id !== id);
    set({ records: newRecords });
    saveRecords(newRecords);
  },

  clearRecords: () => {
    set({ records: [], alertLatch: false });
    saveRecords([]);
  },

  updateSettings: partialSettings => {
    const newSettings = { ...get().settings, ...partialSettings };
    set({ settings: newSettings });
  },

  saveSettings: () => {
    saveSettings(get().settings);
  },

  adoptSnapshot: snapshot => {
    set({
      records: snapshot.records,
      settings: snapshot.settings,
      // Relu plutôt que recopié : une contraction ouverte dans le fichier peut
      // être périmée à l'instant où on le relit, et c'est `loadActiveStart`
      // qui tient cette règle des cinq minutes.
      activeStart: loadActiveStart(),
      alertLatch: false,
    });
  },

  startContraction: () => {
    const start = Date.now();
    set({ activeStart: start });
    saveActiveStart(start);
  },

  endContraction: (note, intensity) => {
    const { activeStart, records } = get();
    if (activeStart === null) return;

    const newRecord: ContractionRecord = {
      id: crypto.randomUUID(),
      start: activeStart,
      end: Date.now(),
      note,
      // Pas de repli : une intensité non déclarée reste absente. Elle valait 2
      // par défaut, ce qui inventait une douleur pour toute contraction que
      // l'utilisatrice n'avait pas notée.
      intensity,
    };

    set({
      records: [...records, newRecord],
      activeStart: null,
    });
    saveRecords([...records, newRecord]);
    saveActiveStart(null);
  },

  setAlertLatch: latched => {
    set({ alertLatch: latched });
  },
}));

/*
 * Synchroniser avec un AUTRE ONGLET.
 *
 * UNE SEULE CLÉ DÉSORMAIS. L'état tenait dans trois clés `localStorage`
 * distinctes, et il fallait trois branches pour les suivre ; il tient dans un
 * instantané versionné (`mc_app`). L'événement `storage` ne se déclenche que
 * dans les AUTRES onglets, donc relire les trois morceaux d'un coup ne coûte
 * rien et ne peut plus les laisser diverger.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', e => {
    if (e.key !== SNAPSHOT_KEY) return;
    useAppStore.setState({
      settings: loadSettings(),
      records: loadRecords(),
      activeStart: loadActiveStart(),
    });
  });
}

// Hook pour recharger les settings depuis localStorage
export function useRefreshSettings() {
  return useAppStore(s => s.updateSettings);
}
