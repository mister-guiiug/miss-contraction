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
      const parsed = JSON.parse(saved);
      // Fusionner avec DEFAULT_ITEMS pour être sûr d'avoir les bases si on a vidé
      return parsed;
    } catch (e) {
      console.error('Error parsing checklist from localStorage', e);
      return DEFAULT_ITEMS;
    }
  });
  const [newItemText, setNewItemText] = useState('');
  const [activeCategory, setActiveCategory] = useState<ChecklistItem['category']>('docs');

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

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      label: newItemText.trim(),
      category: activeCategory,
      checked: false,
    };
    setItems(prev => [...prev, newItem]);
    setNewItemText('');
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
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
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="section-title">Ajouter un élément personnalisé</h3>
        <form onSubmit={addItem} className="checklist-add-form" style={{ marginTop: '1rem' }}>
          <div className="field">
            <label htmlFor="new-item-category">Catégorie</label>
            <select
              id="new-item-category"
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value as any)}
              className="select-full"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="new-item-text">Nom de l'élément</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="new-item-text"
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Ex: Coussin d'allaitement..."
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary">Ajouter</button>
            </div>
          </div>
        </form>
      </section>

      {categories.map(cat => (
        <div key={cat.id} className="card" style={{ marginBottom: '1rem' }}>
          <h3 className="section-title">
            <span style={{ marginRight: '0.5rem' }}>{cat.icon}</span>
            {cat.label}
          </h3>
          <div className="checklist-items" style={{ marginTop: '0.5rem' }}>
            {items
              .filter(item => item.category === cat.id)
              .map(item => (
                <div key={item.id} className="checklist-row" style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border-color, #eee)'
                }}>
                  <label className="field-check" style={{ margin: 0, flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleItem(item.id)}
                    />
                    <span style={{
                      textDecoration: item.checked ? 'line-through' : 'none',
                      opacity: item.checked ? 0.6 : 1,
                      transition: 'all 0.2s'
                    }}>
                      {item.label}
                    </span>
                  </label>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="btn-delete-item"
                    aria-label="Supprimer"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff4444',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      padding: '0 0.5rem'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            {items.filter(item => item.category === cat.id).length === 0 && (
              <p className="hint" style={{ padding: '0.5rem 0' }}>Aucun élément dans cette catégorie.</p>
            )}
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
