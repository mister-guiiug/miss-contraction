#!/usr/bin/env node
/**
 * Refuse les signatures d'assistant IA dans les messages de commit et les
 * fichiers versionnés.
 *
 * ── POURQUOI ─────────────────────────────────────────────────────────────────
 *
 * Quatre-vingt-dix-huit commits de ce dépôt portent une ligne
 * `Co-Authored-By: Claude …` ou `🤖 Generated with Claude Code`. Elles ne
 * disent rien d'utile : l'historique sert à comprendre POURQUOI un changement
 * a eu lieu, pas avec quel éditeur il a été tapé. Personne n'annote ses commits
 * du nom de son IDE. Et ces lignes se propagent — un agent qui lit
 * l'historique pour en imiter le style les reconduit indéfiniment.
 *
 * ── CE QUI EST REFUSÉ, ET CE QUI NE L'EST PAS ────────────────────────────────
 *
 * `Co-Authored-By` RESTE AUTORISÉ pour un être humain. C'est un attribut git
 * légitime, et le bannir en bloc empêcherait de créditer une vraie séance à
 * deux. Seules sont refusées les lignes qui nomment un assistant connu ou son
 * adresse de robot, plus les mentions de génération automatique.
 *
 * Usage :
 *   node scripts/check-ai-attribution.mjs --message <fichier>   (hook commit-msg)
 *   node scripts/check-ai-attribution.mjs --files <f1> <f2> …   (hook pre-commit)
 */

import { readFileSync } from 'node:fs';

/**
 * Chaque motif porte son explication : le message d'erreur doit apprendre
 * quelque chose, pas seulement interdire.
 */
export const PATTERNS = [
  {
    id: 'co-authored-ia',
    /*
     * `Co-Authored-By:` suivi d'un nom d'assistant OU d'une adresse de robot.
     *
     * L'ancre tolère les marqueurs de commentaire. Ancrée sur `^\s*`, elle
     * attrapait bien le trailer d'un message de commit mais ratait
     * `// Co-Authored-By: Claude …` dans un fichier — précisément le cas que
     * le hook `pre-commit` est censé couvrir.
     */
    regex:
      /^[\s*/#>-]*co-authored-by:.*(claude|anthropic|copilot|chatgpt|openai|gemini|cursor|codeium|devin|noreply@anthropic\.com)/i,
    quoi: 'une ligne `Co-Authored-By` créditant un assistant IA',
  },
  {
    id: 'generated-with',
    regex:
      /(generated with|généré (avec|par)|created (with|by))\s*\[?\s*(claude|chatgpt|copilot|cursor|gemini)/i,
    quoi: 'une mention « generated with … »',
  },
  {
    id: 'robot',
    regex: /🤖/u,
    quoi: "l'émoji robot, qui accompagne ces signatures",
  },
  {
    id: 'claude-code-url',
    regex: /claude\.(ai|com)\/code/i,
    quoi: 'un lien promotionnel vers Claude Code',
  },
];

/**
 * Les fichiers qui ont le DROIT de citer ces motifs, parce qu'ils sont la
 * règle elle-même.
 *
 * Une liste de chemins, pas un marqueur en commentaire : cinq fichiers, tous
 * connus, et rien ne doit pouvoir s'exempter en s'ajoutant une ligne. Allonger
 * cette liste est une décision, pas un réflexe.
 */
export const EXEMPTS = [
  'scripts/check-ai-attribution.mjs',
  'src/aiAttribution.test.ts',
  'AGENTS.md',
  'CLAUDE.md',
  '.github/workflows/no-ai-attribution.yml',
];

/** Le chemin est-il celui d'un fichier qui énonce la règle ? */
export function estExempt(chemin) {
  const normalise = chemin.replace(/\\/g, '/');
  return EXEMPTS.some(e => normalise === e || normalise.endsWith(`/${e}`));
}

/** Rend la liste des motifs trouvés, avec leur numéro de ligne. */
export function findAttribution(text) {
  const lignes = text.split(/\r?\n/);
  const trouves = [];

  for (const motif of PATTERNS) {
    for (const [i, ligne] of lignes.entries()) {
      // Les motifs multilignes sont ancrés ligne à ligne : on teste chacune.
      const re = new RegExp(
        motif.regex.source,
        motif.regex.flags.replace('m', '')
      );
      if (re.test(ligne)) {
        trouves.push({
          id: motif.id,
          quoi: motif.quoi,
          ligne: i + 1,
          texte: ligne.trim(),
        });
        break; // une occurrence par motif suffit à refuser
      }
    }
  }
  return trouves;
}

const RAPPEL = `
  L'historique de ce dépôt explique POURQUOI un changement a eu lieu.
  Avec quel outil il a été écrit n'en fait pas partie — pas plus que le nom
  de l'éditeur de texte. Retirez la ligne et recommencez.

  \`Co-Authored-By\` reste bienvenu pour créditer une personne.

  Voir AGENTS.md, section « Signature et attribution ».`;

function main(argv) {
  const mode = argv[2];
  const cibles = argv.slice(3);
  let faute = false;

  if (mode === '--message') {
    const fichier = cibles[0];
    const trouves = findAttribution(readFileSync(fichier, 'utf8'));
    if (trouves.length > 0) {
      faute = true;
      console.error('\n✗ Message de commit refusé.\n');
      for (const t of trouves) {
        console.error(`  ligne ${t.ligne} — ${t.quoi}`);
        console.error(`    ${t.texte}`);
      }
      console.error(RAPPEL);
    }
  } else if (mode === '--files') {
    for (const fichier of cibles) {
      if (estExempt(fichier)) continue;

      let contenu;
      try {
        contenu = readFileSync(fichier, 'utf8');
      } catch {
        continue; // fichier supprimé ou binaire : rien à lire
      }
      const trouves = findAttribution(contenu);
      if (trouves.length > 0) {
        faute = true;
        console.error(`\n✗ ${fichier}`);
        for (const t of trouves) {
          console.error(`  ligne ${t.ligne} — ${t.quoi}`);
          console.error(`    ${t.texte}`);
        }
      }
    }
    if (faute) console.error(RAPPEL);
  } else {
    console.error(
      'Usage : check-ai-attribution.mjs --message <fichier> | --files <fichiers…>'
    );
    return 2;
  }

  return faute ? 1 : 0;
}

// N'exécute rien à l'import : le fichier de test importe `findAttribution`.
if (process.argv[1] && process.argv[1].endsWith('check-ai-attribution.mjs')) {
  process.exit(main(process.argv));
}
