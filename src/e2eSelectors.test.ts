/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as storage from './storage';

/**
 * Le garde-fou du harnais de bout en bout.
 *
 * POURQUOI IL EST ICI, DANS LES TESTS UNITAIRES. La CI passe `run-e2e: false`
 * au workflow du socle : personne ne lance Playwright automatiquement. Le
 * harnais a donc pourri sans bruit pendant des mois — quarante-huit
 * `data-testid` visant un balisage qui n'a jamais existé (ils venaient de
 * `e2e/DATA_TESTID_IMPLEMENTATION.md`, un plan jamais appliqué), et trois clés
 * `localStorage` fausses sur trois. Vingt et un tests échouaient.
 *
 * Ce fichier-ci tourne avec `npm run test`, donc DANS la CI. Il ne remplace
 * pas les tests de bout en bout : il garantit seulement qu'ils continuent de
 * parler du même produit. Un crochet supprimé d'un composant casse ce test
 * tout de suite, au lieu d'attendre que quelqu'un pense à lancer Playwright.
 */

const root = process.cwd();

function readAll(dir: string, ext: string[]): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      out.push(...readAll(path, ext));
    } else if (ext.some(e => entry.endsWith(e))) {
      out.push(readFileSync(path, 'utf8'));
    }
  }
  return out;
}

/**
 * Retire commentaires de bloc et de ligne.
 *
 * Sans ça, ce test se dénonce lui-même : les commentaires qui expliquent
 * quels crochets ONT ÉTÉ retirés en citent le nom, et seraient comptés comme
 * des sélecteurs vivants.
 */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const APP_SOURCE = readAll(resolve(root, 'src/react'), ['.tsx', '.ts']).join(
  '\n'
);
const E2E_FILES = readdirSync(resolve(root, 'e2e'))
  .filter(f => f.endsWith('.ts'))
  .map(f => ({
    name: f,
    text: stripComments(readFileSync(resolve(root, 'e2e', f), 'utf8')),
  }));
const E2E_PAGES = readdirSync(resolve(root, 'e2e/pages')).map(f => ({
  name: `pages/${f}`,
  text: stripComments(readFileSync(resolve(root, 'e2e/pages', f), 'utf8')),
}));
const E2E_ALL = [...E2E_FILES, ...E2E_PAGES];

/**
 * Les préfixes des `data-testid` engendrés, par exemple `intensity-option-`
 * pour `` data-testid={`intensity-option-${level}`} ``. Un test qui vise
 * `intensity-option-3` est légitime : c'est le niveau 3 de ce gabarit.
 */
const TEMPLATE_PREFIXES = [
  ...APP_SOURCE.matchAll(/data-testid=\{`([^$`]*)\$\{/g),
].map(m => m[1] as string);

/**
 * Un `data-testid` est-il posé quelque part dans les composants ?
 *
 * Trois écritures coexistent et comptent toutes : l'attribut littéral, la
 * prop `dataTestId` que `ViewLayout` transmet à sa racine, et les gabarits
 * ci-dessus — dont on ne peut vérifier que le préfixe.
 */
function isMounted(id: string): boolean {
  if (APP_SOURCE.includes(`data-testid="${id}"`)) return true;
  if (APP_SOURCE.includes(`dataTestId="${id}"`)) return true;
  const asked = id.replace(/\$\{.*$/, '');
  return TEMPLATE_PREFIXES.some(
    prefix => asked.startsWith(prefix) || prefix.startsWith(asked)
  );
}

describe('sélecteurs du harnais e2e', () => {
  const declared = [
    ...new Set(
      [
        ...stripComments(
          readFileSync(resolve(root, 'e2e/config.ts'), 'utf8')
        ).matchAll(/data-testid="([^"]+)"/g),
      ].map(m => m[1] as string)
    ),
  ];

  it('e2e/config.ts en déclare un nombre plausible', () => {
    expect(declared.length).toBeGreaterThan(20);
  });

  for (const id of declared) {
    it(`« ${id} » existe dans les composants`, () => {
      expect(isMounted(id), `aucun composant ne pose data-testid="${id}"`).toBe(
        true
      );
    });
  }

  it('aucun fichier e2e ne vise un testid absent des composants', () => {
    const orphelins = new Set<string>();
    for (const { name, text } of E2E_ALL) {
      for (const m of text.matchAll(/data-testid="([^"^$]+)"/g)) {
        const id = m[1] as string;
        if (!isMounted(id)) orphelins.add(`${name} → ${id}`);
      }
    }
    expect([...orphelins]).toEqual([]);
  });
});

describe('clés localStorage du harnais e2e', () => {
  const real = new Set(
    Object.entries(storage)
      .filter(([k, v]) => k.startsWith('KEY_') && typeof v === 'string')
      .map(([, v]) => v as string)
  );

  it("l'application en expose bien cinq", () => {
    expect(real.size).toBe(5);
  });

  it('les tests e2e ne citent que des clés réelles', () => {
    const inconnues = new Set<string>();
    for (const { name, text } of E2E_ALL) {
      for (const m of text.matchAll(/'(mc_[a-z_0-9]+)'/g)) {
        const key = m[1] as string;
        if (!real.has(key)) inconnues.add(`${name} → ${key}`);
      }
    }
    expect([...inconnues]).toEqual([]);
  });
});
