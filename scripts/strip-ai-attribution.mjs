#!/usr/bin/env node
/**
 * Retire les signatures d'assistant d'un message de commit, sur l'entrée
 * standard, et rend le message nettoyé sur la sortie standard.
 *
 * Sert de `--msg-filter` à `git filter-branch` pour la réécriture unique de
 * l'historique. Il ne touche à rien d'autre : ni auteur, ni date, ni contenu.
 *
 * IL NE PARTAGE PAS LES MOTIFS DE `check-ai-attribution.mjs`, ET C'EST VOULU.
 * Le contrôleur DÉTECTE, au risque d'un faux positif qu'un humain arbitre ;
 * celui-ci SUPPRIME, sans personne pour relire les quatre-vingt-dix-neuf
 * messages. Il n'efface donc que des lignes entières dont la forme est
 * certaine, et laisse tout le reste intact — y compris ce qu'il ne comprend
 * pas.
 */

import { readFileSync } from 'node:fs';

/**
 * Une ligne est-elle une signature à retirer ?
 *
 * Uniquement des lignes ENTIÈRES, jamais un fragment au milieu d'une phrase :
 * on ne veut pas mutiler un message qui parlerait d'un outil.
 */
export function estSignature(ligne) {
  const l = ligne.trim();
  if (l === '') return false;

  // Trailer créditant un assistant ou une adresse de robot.
  if (
    /^co-authored-by:.*(claude|anthropic|copilot|chatgpt|openai|gemini|cursor|codeium|devin)/i.test(
      l
    )
  ) {
    return true;
  }

  // Ligne de génération automatique, avec ou sans émoji ni lien.
  if (
    /^[\s\u{1F300}-\u{1FAFF}]*(generated with|généré (avec|par)|created (with|by))\b/iu.test(
      l
    )
  ) {
    return true;
  }

  return false;
}

/**
 * Nettoie un message : retire les signatures, puis les lignes vides qu'elles
 * laissent en fin de message. Un message ne doit pas se terminer par le trou
 * d'une ligne supprimée.
 */
export function stripAttribution(message) {
  const gardees = message.split('\n').filter(ligne => !estSignature(ligne));

  while (gardees.length > 0 && gardees[gardees.length - 1].trim() === '') {
    gardees.pop();
  }

  return gardees.join('\n') + '\n';
}

if (process.argv[1] && process.argv[1].endsWith('strip-ai-attribution.mjs')) {
  process.stdout.write(stripAttribution(readFileSync(0, 'utf8')));
}
