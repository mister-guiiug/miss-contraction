/**
 * L'échelle d'intensité, côté TypeScript.
 *
 * LES HEX NE SONT PAS ICI. Ils vivent dans `src/styles.css`, bloc
 * « Échelle d'intensité », et ce module n'en tient que les noms. Les cinq
 * couleurs étaient auparavant recopiées à cinq endroits — ce fichier, un
 * littéral dans `TimelineCompact`, trois blocs de `styles.css` — et le
 * correctif de contraste du niveau 3 n'avait atteint que deux d'entre eux.
 *
 * `color` sert à `IntensityPicker`, qui la pousse dans `--intensity-color`
 * pour teinter la bordure et le halo du bouton sélectionné. Une variable CSS
 * qui en référence une autre se résout normalement, y compris à l'intérieur
 * d'un `color-mix()` — c'est ce que fait la feuille de style.
 *
 * `textColor` a disparu : personne ne la lisait, et l'encre des pastilles est
 * désormais `--intensity-ink`, posée par le même bloc que les fonds.
 */
export const INTENSITY_DATA = [
  {
    level: 1,
    label: 'Léger',
    description: 'Peu perceptible',
    color: 'var(--intensity-1-bg)',
    emoji: '😊',
  },
  {
    level: 2,
    label: 'Modéré',
    description: 'Gérable',
    color: 'var(--intensity-2-bg)',
    emoji: '🙂',
  },
  {
    level: 3,
    label: 'Soutenu',
    description: 'Requiert de la concentration',
    color: 'var(--intensity-3-bg)',
    emoji: '😐',
  },
  {
    level: 4,
    label: 'Fort',
    description: 'Difficile à supporter',
    color: 'var(--intensity-4-bg)',
    emoji: '😣',
  },
  {
    level: 5,
    label: 'Très fort',
    description: 'Maximum',
    color: 'var(--intensity-5-bg)',
    emoji: '😫',
  },
];
