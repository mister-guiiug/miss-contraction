/**
 * Types du contrôleur de signatures.
 *
 * Le script est en JavaScript — il tourne dans les hooks git, sans passer par
 * TypeScript. Ce fichier lui donne quand même un contrat, pour que
 * `src/aiAttribution.test.ts` soit vérifié comme le reste du dépôt plutôt que
 * muselé par un `@ts-expect-error`.
 */

export interface Attribution {
  /** Identifiant du motif, par exemple `co-authored-ia`. */
  id: string;
  /** Formulation lisible, reprise dans le message d'erreur. */
  quoi: string;
  /** Numéro de ligne, à partir de 1. */
  ligne: number;
  /** La ligne fautive, détourée. */
  texte: string;
}

/** Les fichiers autorisés à citer les motifs : ils énoncent la règle. */
export declare const EXEMPTS: readonly string[];

/** Le chemin est-il celui d'un fichier exempté ? */
export declare function estExempt(chemin: string): boolean;

/** Rend les signatures trouvées dans un texte, vide si aucune. */
export declare function findAttribution(text: string): Attribution[];
