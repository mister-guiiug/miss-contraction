import { describe, it, expect, afterEach } from "vitest";
import { parseRoute, getDocumentTitle, getBreadcrumbLabel, hrefForRoute, ROUTE_META } from "./router";
import type { AppRoute } from "./router";

describe("parseRoute", () => {
  const originalHash = window.location.hash;

  afterEach(() => {
    window.location.hash = originalHash;
  });

  it("retourne home par défaut (hash vide)", () => {
    window.location.hash = "";
    expect(parseRoute()).toBe("home");
  });

  it("retourne home pour hash inconnu", () => {
    window.location.hash = "#/inconnu";
    expect(parseRoute()).toBe("home");
  });

  it("détecte settings (#/parametres)", () => {
    window.location.hash = "#/parametres";
    expect(parseRoute()).toBe("settings");
  });

  it("détecte settings alias (#/settings)", () => {
    window.location.hash = "#/settings";
    expect(parseRoute()).toBe("settings");
  });

  it("détecte message (#/message)", () => {
    window.location.hash = "#/message";
    expect(parseRoute()).toBe("message");
  });

  it("détecte message alias (#/sms)", () => {
    window.location.hash = "#/sms";
    expect(parseRoute()).toBe("message");
  });

  it("détecte table (#/historique)", () => {
    window.location.hash = "#/historique";
    expect(parseRoute()).toBe("table");
  });

  it("détecte maternity (#/maternite)", () => {
    window.location.hash = "#/maternite";
    expect(parseRoute()).toBe("maternity");
  });

  it("détecte midwife (#/sage-femme)", () => {
    window.location.hash = "#/sage-femme";
    expect(parseRoute()).toBe("midwife");
  });
});

describe("ROUTE_META", () => {
  const routes: AppRoute[] = ["home", "settings", "message", "table", "maternity", "midwife"];

  it("couvre toutes les routes", () => {
    for (const route of routes) {
      expect(ROUTE_META[route]).toBeDefined();
    }
  });

  it("chaque route a un documentTitle non vide", () => {
    for (const route of routes) {
      expect(ROUTE_META[route].documentTitle.length).toBeGreaterThan(3);
    }
  });

  it("chaque route a un breadcrumb non vide", () => {
    for (const route of routes) {
      expect(ROUTE_META[route].breadcrumb.length).toBeGreaterThan(2);
    }
  });
});

describe("getDocumentTitle", () => {
  it("home : pas de tiret suffixe", () => {
    expect(getDocumentTitle("home")).toBe("Miss Contraction");
  });

  it("settings : contient le titre de l'app", () => {
    expect(getDocumentTitle("settings")).toContain("Miss Contraction");
  });
});

describe("getBreadcrumbLabel", () => {
  it("home → Accueil", () => {
    expect(getBreadcrumbLabel("home")).toBe("Accueil");
  });

  it("settings → Paramètres", () => {
    expect(getBreadcrumbLabel("settings")).toBe("Paramètres");
  });
});

describe("hrefForRoute", () => {
  it("home → #/", () => {
    expect(hrefForRoute("home")).toBe("#/");
  });

  it("settings → #/parametres", () => {
    expect(hrefForRoute("settings")).toBe("#/parametres");
  });

  it("table → #/historique", () => {
    expect(hrefForRoute("table")).toBe("#/historique");
  });

  it("midwife → #/sage-femme", () => {
    expect(hrefForRoute("midwife")).toBe("#/sage-femme");
  });
});
