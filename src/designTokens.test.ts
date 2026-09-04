/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { INTENSITY_DATA } from './utils/intensity';

/*
 * On lit la feuille depuis le disque, et pas par `import './styles.css?raw'` :
 * Vitest neutralise les imports CSS (`css: false` par défaut) et rendrait une
 * chaîne vide, donc un test toujours vert. La référence à `node` est portée
 * par ce fichier seul — le `types` du socle ne liste pas les globales Node,
 * exprès, puisque le code applicatif tourne dans un navigateur.
 *
 * Fins de ligne normalisées : le dépôt est cloné en CRLF sous Windows, et les
 * expressions ci-dessous ancrent sur des sauts de ligne.
 */
const read = (name: string) =>
  readFileSync(resolve(process.cwd(), 'src', name), 'utf8')
    .split('\r\n')
    .join('\n');

/** `styles.css` seule : c'est elle qui définit les tokens. */
const STYLES = read('styles.css');
/** Les trois feuilles, pour les règles qui valent partout. */
const ALL_CSS = [STYLES, read('enhanced-styles.css'), read('enhanced-ui.css')];

/**
 * Le garde-fou des tokens de couleur.
 *
 * POURQUOI IL EXISTE. L'audit du design system a trouvé la même panne quatre
 * fois : une couleur écrite en dur, recopiée, identique dans les deux thèmes,
 * et illisible dans l'un des deux. Quatre pastilles d'intensité sur cinq
 * (jusqu'à 1,46:1), les boutons principaux et de suppression en thème sombre
 * (2,8:1 et 2,6:1), neuf combinaisons sur douze des pastilles de note et de
 * tendance. Aucune ne se voyait à la relecture : il fallait calculer.
 *
 * CE QU'IL VERROUILLE. Que chaque encre reste au-dessus de 4,5:1 sur le fond
 * qu'elle est censée occuper, dans les DEUX thèmes. Une teinte changée sans
 * vérification casse ce test, pas l'écran de quelqu'un en travail.
 */

/** Le bloc de thème clair : `:root, html[data-theme='light'] { … }`. */
const LIGHT = section(/:root,\s*\nhtml\[data-theme='light'\] \{/);
/** Le bloc de thème sombre. */
const DARK = section(/html\[data-theme='dark'\] \{/);

function section(start: RegExp): string {
  const found = start.exec(STYLES);
  if (!found) throw new Error(`Bloc de thème introuvable : ${String(start)}`);
  const from = found.index + found[0].length;
  const end = STYLES.indexOf('\n}', from);
  return STYLES.slice(from, end);
}

/**
 * Lit un token dans un bloc, en suivant un éventuel renvoi : le thème sombre
 * définit `--primary-contrast: var(--bg)`, qui doit se résoudre en la valeur
 * de `--bg` du même bloc.
 */
function token(name: string, scope: string = STYLES, depth = 0): string {
  if (depth > 4) throw new Error(`Renvois circulaires sur --${name}`);
  const found = new RegExp(`--${name}:\\s*([^;]+);`).exec(scope);
  const value = found?.[1]?.trim();
  if (!value) throw new Error(`Token --${name} introuvable`);
  const ref = /^var\(--([a-z0-9-]+)\)$/.exec(value)?.[1];
  return ref ? token(ref, scope, depth + 1) : value;
}

type Rgb = [number, number, number];

function channels(color: string): Rgb {
  let h = color.replace('#', '');
  if (h.length === 3)
    h = h
      .split('')
      .map(c => c + c)
      .join('');
  const value = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(value)) throw new Error(`Couleur illisible : ${color}`);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** Luminance relative, WCAG 2.1. */
function luminance([r, g, b]: Rgb): number {
  const linear = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(a: string, b: string): number {
  const la = luminance(channels(a));
  const lb = luminance(channels(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Aplatit une couleur posée à `alpha` sur un fond opaque. */
function flatten(fg: string, alpha: number, bg: string): string {
  const [fr, fgreen, fb] = channels(fg);
  const [br, bgreen, bb] = channels(bg);
  const mix = (f: number, b: number) =>
    Math.round(f * alpha + b * (1 - alpha))
      .toString(16)
      .padStart(2, '0');
  return `#${mix(fr, br)}${mix(fgreen, bgreen)}${mix(fb, bb)}`;
}

const AA = 4.5;

describe("échelle d'intensité", () => {
  it('ne tient ses hex que dans styles.css', () => {
    for (const entry of INTENSITY_DATA) {
      expect(entry.color).toBe(`var(--intensity-${entry.level}-bg)`);
    }
  });

  it('couvre les cinq niveaux, sans trou ni doublon', () => {
    expect(INTENSITY_DATA.map(e => e.level)).toEqual([1, 2, 3, 4, 5]);
    const fonds = INTENSITY_DATA.map(e => token(`intensity-${e.level}-bg`));
    expect(new Set(fonds).size).toBe(5);
  });

  it('garde le chiffre lisible sur les cinq fonds', () => {
    const ink = token('intensity-ink');
    for (const entry of INTENSITY_DATA) {
      const bg = token(`intensity-${entry.level}-bg`);
      expect(
        contrast(ink, bg),
        `niveau ${entry.level} (${entry.label}) : ${ink} sur ${bg}`
      ).toBeGreaterThanOrEqual(AA);
    }
  });

  it('ne laisse aucune pastille poser sa propre couleur de texte', () => {
    // Les correctifs ponctuels (`color: #444 !important` sur le seul niveau 3)
    // étaient le symptôme de la duplication : un exemplaire corrigé sur cinq.
    expect(STYLES).not.toMatch(/intensity--\d\s*\{[^}]*color:/);
  });
});

const THEMES = [
  { scope: LIGHT, label: 'clair', surface: '#ffffff' },
  { scope: DARK, label: 'sombre', surface: '#160b1c' },
] as const;

describe('encre posée sur les surfaces pleines', () => {
  const cas = [
    ['primary-contrast', 'primary', 'bouton principal'],
    ['danger-contrast', 'danger', 'bouton de suppression'],
  ] as const;

  for (const { scope, label } of THEMES) {
    for (const [inkToken, bgToken, what] of cas) {
      it(`${what}, thème ${label}`, () => {
        const ink = token(inkToken, scope);
        const bg = token(bgToken, scope);
        expect(contrast(ink, bg), `${ink} sur ${bg}`).toBeGreaterThanOrEqual(
          AA
        );
      });
    }
  }
});

describe("teintes d'accent des pastilles", () => {
  const HUES = ['cyan', 'violet', 'orange', 'red', 'green'];

  /*
   * Les pastilles posent leur teinte derrière un texte de cette même teinte :
   * 8 % pour les notes rapides, 12 % pour la tendance et les badges de
   * maturité. LE PIRE CAS EST LA TEINTE LA PLUS DENSE — plus il y a de couleur
   * dans le fond, plus celui-ci se rapproche du texte. C'est donc 12 % qu'on
   * mesure, et cette valeur plafonne ce que les feuilles peuvent écrire : à
   * 14 %, le cyan tombait à 4,4:1.
   */
  const TEINTE_MAX = 0.12;

  for (const { scope, label, surface } of THEMES) {
    for (const hue of HUES) {
      it(`--accent-${hue}, thème ${label}`, () => {
        const ink = token(`accent-${hue}`, scope);
        const bg = flatten(ink, TEINTE_MAX, surface);
        expect(contrast(ink, bg), `${ink} sur ${bg}`).toBeGreaterThanOrEqual(
          AA
        );
      });
    }
  }

  it('aucun fond de pastille ne dépasse le plafond de teinte', () => {
    // Seuls les `background` comptent : une bordure à 30 % ne porte pas de
    // texte, elle n'a rien à voir avec le contraste mesuré ci-dessus.
    const densites = ALL_CSS.flatMap(css =>
      [
        ...css.matchAll(
          /background(?:-color)?:\s*color-mix\(in srgb, currentColor (\d+)%/g
        ),
      ].map(m => Number(m[1]))
    );
    expect(densites.length).toBeGreaterThan(0);
    expect(Math.max(...densites)).toBeLessThanOrEqual(TEINTE_MAX * 100);
  });

  it('les deux thèmes donnent des teintes distinctes', () => {
    for (const hue of HUES) {
      expect(token(`accent-${hue}`, LIGHT)).not.toBe(
        token(`accent-${hue}`, DARK)
      );
    }
  });
});
