import { describe, expect, it } from 'vitest';
import {
  findAttribution,
  estExempt,
  EXEMPTS,
} from '../scripts/check-ai-attribution.mjs';

/**
 * Le garde-fou du garde-fou.
 *
 * Un hook qui ne refuse rien est pire qu'un hook absent : il donne
 * l'impression que la règle est tenue. Ces tests vérifient les deux sens —
 * ce qui doit être refusé l'est, et surtout ce qui doit passer passe.
 */

const REFUSES = [
  'Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>',
  'co-authored-by: Claude <noreply@anthropic.com>',
  'Co-Authored-By: Copilot <copilot@github.com>',
  // En commentaire : c'est tout l'objet du contrôle sur les fichiers.
  '// Co-Authored-By: Claude <noreply@anthropic.com>',
  ' * Co-Authored-By: Claude <noreply@anthropic.com>',
  '# Co-Authored-By: Claude <noreply@anthropic.com>',
  '> Co-Authored-By: Claude <noreply@anthropic.com>',
  '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
  'Generated with Claude Code',
  'Généré par Claude',
  'https://claude.ai/code',
];

const ACCEPTES = [
  // Un être humain reste créditable : c'est tout l'intérêt du trailer.
  'Co-Authored-By: Guillaume Guérin <guillaume@example.com>',
  'Co-Authored-By: Anaïs <anais@example.com>',
  // Le vocabulaire du domaine ne doit pas déclencher de faux positif.
  'fix(a11y): générer les tokens de couleur depuis styles.css',
  'Les captures sont générées au premier passage.',
  'chore(deps): monter openai-tokenizer pour le comptage',
  '.claude/worktrees/ est ignoré par git',
];

describe("refus des signatures d'assistant", () => {
  for (const texte of REFUSES) {
    it(`refuse : ${texte.slice(0, 48)}`, () => {
      expect(findAttribution(texte).length).toBeGreaterThan(0);
    });
  }

  for (const texte of ACCEPTES) {
    it(`accepte : ${texte.slice(0, 48)}`, () => {
      expect(findAttribution(texte)).toEqual([]);
    });
  }

  it('signale la ligne fautive dans un message complet', () => {
    const message = [
      'fix(e2e): réparer le harnais',
      '',
      'Le corps du message, parfaitement légitime.',
      '',
      'Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>',
    ].join('\n');

    const trouves = findAttribution(message);
    expect(trouves).toHaveLength(1);
    expect(trouves[0]).toMatchObject({ ligne: 5, id: 'co-authored-ia' });
  });

  /*
   * Les fichiers qui ÉNONCENT la règle en citent forcément les motifs. Sans
   * exemption, le hook refusait son propre commit — et il l'a fait, la
   * première fois qu'on l'a lancé.
   */
  it('exempte les fichiers qui portent la règle', () => {
    expect(estExempt('AGENTS.md')).toBe(true);
    expect(estExempt('scripts/check-ai-attribution.mjs')).toBe(true);
    // Les hooks passent des chemins relatifs, la CI parfois absolus.
    expect(estExempt('D:/repo/src/aiAttribution.test.ts')).toBe(true);
    expect(estExempt('src\\aiAttribution.test.ts')).toBe(true);
  });

  it("n'exempte rien d'autre", () => {
    expect(estExempt('src/react/views/HomeView.tsx')).toBe(false);
    expect(estExempt('README.md')).toBe(false);
    // Un fichier qui imiterait le nom d'un exempté sans en être un.
    expect(estExempt('docs/AGENTS.md.bak')).toBe(false);
  });

  it('la liste des exemptions reste courte', () => {
    // Si elle s'allonge, c'est que la règle se vide de son sens.
    expect(EXEMPTS.length).toBeLessThanOrEqual(6);
  });

  it('ne refuse pas deux fois le même motif', () => {
    const message = [
      'Co-Authored-By: Claude <noreply@anthropic.com>',
      'Co-Authored-By: Claude <noreply@anthropic.com>',
    ].join('\n');

    expect(findAttribution(message)).toHaveLength(1);
  });
});
