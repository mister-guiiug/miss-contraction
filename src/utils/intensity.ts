export const INTENSITY_DATA = [
  {
    level: 1,
    label: 'Léger',
    description: 'Peu perceptible',
    color: '#80c878',
    textColor: '#fff',
    emoji: '😊',
  },
  {
    level: 2,
    label: 'Modéré',
    description: 'Gérable',
    color: '#a8d678',
    textColor: '#fff',
    emoji: '🙂',
  },
  {
    level: 3,
    label: 'Soutenu',
    description: 'Requiert de la concentration',
    color: '#ffd04b',
    textColor: '#444',
    emoji: '😐',
  },
  {
    level: 4,
    label: 'Fort',
    description: 'Difficile à supporter',
    color: '#ff9d4b',
    textColor: '#fff',
    emoji: '😣',
  },
  {
    level: 5,
    label: 'Très fort',
    description: 'Maximum',
    color: '#ff5e4b',
    textColor: '#fff',
    emoji: '😫',
  },
];

export function getIntensityInfo(level: number) {
  return INTENSITY_DATA.find(i => i.level === level) || INTENSITY_DATA[2];
}
