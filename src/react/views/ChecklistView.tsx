import { useState, useEffect } from 'react';
import { ViewLayout } from '../components/layout/ViewLayout';
import { AppFooter } from '../components/layout/AppFooter';

interface ChecklistItem {
  id: string;
  label: string;
  category: 'mama' | 'baby' | 'partner' | 'docs';
  checked: boolean;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  {
    id: '1',
    label: 'Dossier médical & carte vitale',
    category: 'docs',
    checked: false,
  },
  { id: '2', label: 'Projet de naissance', category: 'docs', checked: false },
  { id: '3', label: 'Livret de famille', category: 'docs', checked: false },
  { id: '4', label: 'Pyjamas & Bodies (x5)', category: 'baby', checked: false },
  { id: '5', label: 'Bonnets & Chaussons', category: 'baby', checked: false },
  { id: '6', label: 'Gigoteuse', category: 'baby', checked: false },
  { id: '7', label: 'Tenues confortables', category: 'mama', checked: false },
  {
    id: '8',
    label: "Soutiens-gorge d'allaitement",
    category: 'mama',
    checked: false,
  },
  { id: '9', label: 'Trousse de toilette', category: 'mama', checked: false },
  { id: '10', label: 'Snacks & Boissons', category: 'partner', checked: false },
  {
    id: '11',
    label: 'Chargeur de téléphone long',
    category: 'partner',
    checked: false,
  },
  {
    id: '12',
    label: 'Appareil photo / Caméra',
    category: 'partner',
    checked: false,
  },
];

export function ChecklistView() {
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
    { id: 'docs', label: 'Papiers & Documents', icon: '📄' },
    { id: 'mama', label: 'Pour Maman', icon: '🤰' },
    { id: 'baby', label: 'Pour Bébé', icon: '👶' },
    { id: 'partner', label: 'Pour le Partenaire / Accompagnant', icon: '👫' },
  ];

  return (
    <ViewLayout
      id="view-checklist"
      title="Valise maternité"
      lead="Préparez sereinement votre départ pour la maternité avec cette liste essentielle."
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
                  <span>{item.label}</span>
                </label>
              ))}
          </div>
        </div>
      ))}

      <div
        className="card panel panel-cta"
        style={{ textAlign: 'center', marginTop: '1rem' }}
      >
        <p className="cta-hint">
          Cette liste est enregistrée localement sur votre téléphone.
        </p>
        <button
          className="btn btn-secondary btn-small"
          onClick={() => {
            if (confirm('Réinitialiser la liste ?')) {
              setItems(DEFAULT_ITEMS);
            }
          }}
        >
          Réinitialiser la liste
        </button>
      </div>
    </ViewLayout>
  );
}
