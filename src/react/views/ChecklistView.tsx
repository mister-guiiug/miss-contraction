import { useState, useEffect } from 'react';
import { ViewLayout } from '../components/layout/ViewLayout';
import { AppFooter } from '../components/layout/AppFooter';
import { t } from '../../i18n';
import { useAppStore } from '../store/useAppStore';

interface ChecklistItem {
  id: string;
  category: 'mama' | 'baby' | 'partner' | 'docs';
  checked: boolean;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: '1', category: 'docs', checked: false },
  { id: '2', category: 'docs', checked: false },
  { id: '3', category: 'docs', checked: false },
  { id: '4', category: 'baby', checked: false },
  { id: '5', category: 'baby', checked: false },
  { id: '6', category: 'baby', checked: false },
  { id: '7', category: 'mama', checked: false },
  { id: '8', category: 'mama', checked: false },
  { id: '9', category: 'mama', checked: false },
  { id: '10', category: 'partner', checked: false },
  { id: '11', category: 'partner', checked: false },
  { id: '12', category: 'partner', checked: false },
];

const CHECKLIST_LABELS = {
  fr: {
    '1': 'Dossier médical et carte vitale',
    '2': 'Projet de naissance',
    '3': 'Livret de famille',
    '4': 'Pyjamas et bodies (x5)',
    '5': 'Bonnets et chaussons',
    '6': 'Gigoteuse',
    '7': 'Tenues confortables',
    '8': "Soutiens-gorge d'allaitement",
    '9': 'Trousse de toilette',
    '10': 'Snacks et boissons',
    '11': 'Chargeur de téléphone long',
    '12': 'Appareil photo ou caméra',
  },
  en: {
    '1': 'Medical records and health card',
    '2': 'Birth plan',
    '3': 'Family record book',
    '4': 'Pajamas and bodysuits (x5)',
    '5': 'Hats and booties',
    '6': 'Sleep sack',
    '7': 'Comfortable outfits',
    '8': 'Nursing bras',
    '9': 'Toiletry bag',
    '10': 'Snacks and drinks',
    '11': 'Long phone charger',
    '12': 'Camera',
  },
} as const;

function getChecklistLabel(language: string, id: string): string {
  const dictionary =
    language === 'fr' ? CHECKLIST_LABELS.fr : CHECKLIST_LABELS.en;
  return dictionary[id as keyof typeof dictionary] ?? id;
}

export function ChecklistView() {
  const language = useAppStore(state => state.settings.language);
  const [items, setItems] = useState<ChecklistItem[]>(() => {
    const saved = localStorage.getItem('mc_checklist');
    if (!saved) return DEFAULT_ITEMS;
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing checklist from localStorage', e);
      return DEFAULT_ITEMS;
    }
  });

  useEffect(() => {
    localStorage.setItem('mc_checklist', JSON.stringify(items));
  }, [items]);

  const toggleItem = (id: string) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const categories = [
    { id: 'docs', label: t(language, 'checklist.category.docs'), icon: '📄' },
    { id: 'mama', label: t(language, 'checklist.category.mama'), icon: '🤰' },
    { id: 'baby', label: t(language, 'checklist.category.baby'), icon: '👶' },
    {
      id: 'partner',
      label: t(language, 'checklist.category.partner'),
      icon: '👫',
    },
  ];

  return (
    <ViewLayout
      id="view-checklist"
      title={t(language, 'checklist.title')}
      lead={t(language, 'checklist.lead')}
      footer={<AppFooter />}
    >
      {categories.map(cat => (
        <div key={cat.id} className="card">
          <h3 className="section-title">
            <span style={{ marginRight: '0.5rem' }}>{cat.icon}</span>
            {cat.label}
          </h3>
          <div className="form" style={{ marginTop: '0.5rem' }}>
            {items
              .filter(item => item.category === cat.id)
              .map(item => (
                <label key={item.id} className="field-check">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem(item.id)}
                  />
                  <span>{getChecklistLabel(language, item.id)}</span>
                </label>
              ))}
          </div>
        </div>
      ))}

      <div
        className="card panel panel-cta"
        style={{ textAlign: 'center', marginTop: '1rem' }}
      >
        <p className="cta-hint">{t(language, 'checklist.savedLocal')}</p>
        <button
          className="btn btn-secondary btn-small"
          onClick={() => {
            if (confirm(t(language, 'checklist.confirmReset'))) {
              setItems(DEFAULT_ITEMS);
            }
          }}
        >
          {t(language, 'checklist.reset')}
        </button>
      </div>
    </ViewLayout>
  );
}
