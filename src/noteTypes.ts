import { t, type AppLanguage } from './i18n';

/**
 * Le vocabulaire des notes rapides, en un seul endroit.
 *
 * IL Y EN AVAIT DEUX, ET ILS NE PARLAIENT NI LA MÊME LANGUE NI DU MÊME CHOSE.
 * L'accueil proposait cinq notes écrites en français dans le composant ; le
 * dialogue d'édition en proposait quatre autres, écrites en anglais —
 * « Balloon », « Walk », « Rest », « Shower ». Selon l'endroit où on notait un
 * ballon de gymnastique, l'historique gardait « Ballon de gymnastique » ou
 * « Balloon », et le résumé remis à la sage-femme mélangeait les deux.
 *
 * Les identifiants sont ceux qui servaient déjà de suffixe aux classes CSS
 * (`note-tag--waters`) : ils étaient stables, ils deviennent la clé.
 */
export const NOTE_TYPE_IDS = [
  'waters',
  'shower',
  'ball',
  'medication',
  'rest',
] as const;

export type NoteTypeId = (typeof NOTE_TYPE_IDS)[number];

/**
 * Le libellé traduit d'une note rapide.
 *
 * C'est ce texte qui part dans l'enregistrement, pas l'identifiant : une note
 * reste du texte libre, et garder ce que l'utilisatrice a lu au moment où elle
 * a appuyé vaut mieux que retraduire après coup un historique déjà relu par
 * une sage-femme.
 */
export function noteLabel(language: AppLanguage, id: NoteTypeId): string {
  return t(language, `note.${id}`);
}
