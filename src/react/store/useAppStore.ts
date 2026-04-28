/**
 * Store Zustand pour l'état global de l'application
 * Pont entre le monde React et le code vanilla existant
 */

import { create } from 'zustand';
import type { AppSettings, ContractionRecord } from '../../storage';
import { loadSettings, saveSettings, loadRecords, saveRecords } from '../../storage';

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

  startContraction: () => void;
  endContraction: (note?: string, intensity?: number) => void;

  setAlertLatch: (latched: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // État initial - chargé depuis localStorage
  records: loadRecords(),
  settings: loadSettings(),
  activeStart: null,
  alertLatch: false,

  // Actions
  setRecords: (records) => {
    set({ records });
    saveRecords(records);
  },

  addRecord: (record) => {
    const newRecords = [...get().records, record];
    set({ records: newRecords });
    saveRecords(newRecords);
  },

  updateRecord: (id, updates) => {
    const newRecords = get().records.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    );
    set({ records: newRecords });
    saveRecords(newRecords);
  },

  deleteRecord: (id) => {
    const newRecords = get().records.filter((r) => r.id !== id);
    set({ records: newRecords });
    saveRecords(newRecords);
  },

  clearRecords: () => {
    set({ records: [], alertLatch: false });
    saveRecords([]);
  },

  updateSettings: (partialSettings) => {
    const newSettings = { ...get().settings, ...partialSettings };
    set({ settings: newSettings });
  },

  saveSettings: () => {
    saveSettings(get().settings);
  },

  startContraction: () => {
    set({ activeStart: Date.now() });
  },

  endContraction: (note, intensity) => {
    const { activeStart, records } = get();
    if (activeStart === null) return;

    const newRecord: ContractionRecord = {
      id: crypto.randomUUID(),
      start: activeStart,
      end: Date.now(),
      note,
      intensity: intensity ?? 2,
    };

    set({
      records: [...records, newRecord],
      activeStart: null,
    });
    saveRecords([...records, newRecord]);
  },

  setAlertLatch: (latched) => {
    set({ alertLatch: latched });
  },
}));

// Synchroniser avec localStorage (modifications vanilla)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'mc_settings_v1') {
      useAppStore.setState({ settings: loadSettings() });
    }
    if (e.key === 'mc_contractions_v1') {
      useAppStore.setState({ records: loadRecords() });
    }
  });
}

// Hook pour recharger les settings depuis localStorage
export function useRefreshSettings() {
  return useAppStore((s) => s.updateSettings);
}
