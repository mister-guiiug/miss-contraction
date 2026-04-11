import { describe, it, expect, beforeEach } from "vitest";
import { loadSettings, saveSettings, loadRecords, saveRecords } from "./storage";
import type { ContractionRecord } from "./storage";

beforeEach(() => {
  localStorage.clear();
});

describe("loadSettings", () => {
  it("retourne les valeurs par défaut si rien en localStorage", () => {
    const s = loadSettings();
    expect(s.maxIntervalMin).toBe(5);
    expect(s.minDurationSec).toBe(45);
    expect(s.consecutiveCount).toBe(3);
    expect(s.moduleMaternityMessage).toBe(true);
    expect(s.statsWindowMinutes).toBe("all");
  });

  it("fusionne les valeurs stockées avec les valeurs par défaut", () => {
    localStorage.setItem("mc_settings_v1", JSON.stringify({ maxIntervalMin: 10 }));
    const s = loadSettings();
    expect(s.maxIntervalMin).toBe(10);
    expect(s.minDurationSec).toBe(45); // valeur par défaut conservée
  });

  it("clampe les valeurs hors plage (max 30)", () => {
    localStorage.setItem("mc_settings_v1", JSON.stringify({ maxIntervalMin: 999 }));
    const s = loadSettings();
    expect(s.maxIntervalMin).toBe(30);
  });

  it("clampe les valeurs hors plage (min 1)", () => {
    localStorage.setItem("mc_settings_v1", JSON.stringify({ maxIntervalMin: 0 }));
    const s = loadSettings();
    expect(s.maxIntervalMin).toBe(1);
  });

  it("ne plante pas et retourne les valeurs par défaut si JSON invalide", () => {
    localStorage.setItem("mc_settings_v1", "invalid{json");
    expect(() => loadSettings()).not.toThrow();
    const s = loadSettings();
    expect(s.maxIntervalMin).toBe(5);
  });
});

describe("saveSettings / loadSettings (aller-retour)", () => {
  it("persiste et relit les paramètres", () => {
    const s = loadSettings();
    s.maxIntervalMin = 8;
    s.maternityLabel = "CHU Nantes";
    saveSettings(s);
    const loaded = loadSettings();
    expect(loaded.maxIntervalMin).toBe(8);
    expect(loaded.maternityLabel).toBe("CHU Nantes");
  });
});

describe("loadRecords / saveRecords", () => {
  it("retourne [] si localStorage vide", () => {
    expect(loadRecords()).toEqual([]);
  });

  it("persiste et relit les enregistrements", () => {
    const records: ContractionRecord[] = [
      { id: "a1", start: 1000, end: 2000 },
      { id: "a2", start: 3000, end: 4000, note: "intense" },
    ];
    saveRecords(records);
    const loaded = loadRecords();
    expect(loaded).toHaveLength(2);
    expect(loaded[0]?.id).toBe("a1");
    expect(loaded[1]?.note).toBe("intense");
  });

  it("retourne [] si JSON invalide", () => {
    localStorage.setItem("mc_contractions_v1", "bad-json");
    expect(loadRecords()).toEqual([]);
  });

  it("filtre les entrées invalides (null, nombre, end < start)", () => {
    localStorage.setItem(
      "mc_contractions_v1",
      JSON.stringify([
        null,
        42,
        { id: "ok", start: 1000, end: 2000 },
        { id: "bad-end", start: 5000, end: 4000 }, // end < start
      ])
    );
    const loaded = loadRecords();
    expect(loaded).toHaveLength(1);
    expect(loaded[0]?.id).toBe("ok");
  });
});
