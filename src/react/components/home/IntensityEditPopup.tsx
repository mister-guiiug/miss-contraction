import { useState, useMemo } from 'react';

interface IntensityEditPopupProps {
  currentIntensity?: number;
  onSave: (intensity: number) => void;
  onCancel: () => void;
}

/**
 * Popup de modification d'intensité pour l'historique
 * Apparaît quand on clique sur l'intensité d'une contraction passée
 */
export function IntensityEditPopup({ currentIntensity, onSave, onCancel }: IntensityEditPopupProps) {
  const [tempIntensity, setTempIntensity] = useState(currentIntensity ?? 3);

  const intensities = useMemo(() => [
    {
      level: 1,
      color: '#80c878',
      label: 'Léger',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="12" r="5" opacity="0.25" />
        </svg>
      ),
    },
    {
      level: 2,
      color: '#a8d678',
      label: 'Modéré',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <circle cx="12" cy="12" r="2.5" />
          <circle cx="12" cy="12" r="5" opacity="0.25" />
          <circle cx="12" cy="12" r="8" opacity="0.15" />
        </svg>
      ),
    },
    {
      level: 3,
      color: '#ffd04b',
      label: 'Soutenu',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="5.5" opacity="0.25" />
          <circle cx="12" cy="12" r="8.5" opacity="0.15" />
          <circle cx="12" cy="12" r="11.5" opacity="0.08" />
        </svg>
      ),
    },
    {
      level: 4,
      color: '#ff9d4b',
      label: 'Fort',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <circle cx="12" cy="12" r="3.5" />
          <circle cx="12" cy="12" r="6" opacity="0.25" />
          <circle cx="12" cy="12" r="9" opacity="0.15" />
          <circle cx="12" cy="12" r="12" opacity="0.1" />
        </svg>
      ),
    },
    {
      level: 5,
      color: '#ff5e4b',
      label: 'Très fort',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="6.5" opacity="0.25" />
          <circle cx="12" cy="12" r="9.5" opacity="0.15" />
          <circle cx="12" cy="12" r="12.5" opacity="0.1" />
        </svg>
      ),
    },
  ], []);

  const handleSave = () => {
    onSave(tempIntensity);
  };

  return (
    <div className="intensity-edit-overlay" onClick={onCancel}>
      <div
        className="intensity-edit-popup"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="intensity-edit-title"
      >
        <h3 id="intensity-edit-title" className="intensity-edit-title">
          Modifier l'intensité
        </h3>
        <p className="intensity-edit-subtitle">
          Sélectionnez le nouveau niveau d'intensité pour cette contraction
        </p>

        <div className="intensity-edit-grid">
          {intensities.map((intensity) => (
            <button
              key={intensity.level}
              type="button"
              className={`intensity-edit-option ${tempIntensity === intensity.level ? 'intensity-edit-option--selected' : ''}`}
              onClick={() => setTempIntensity(intensity.level)}
              style={{
                '--intensity-color': intensity.color,
              } as React.CSSProperties}
              aria-label={`Intensité ${intensity.level} : ${intensity.label}`}
              aria-pressed={tempIntensity === intensity.level}
            >
              <span className="intensity-edit-icon" style={{ color: intensity.color }}>
                {intensity.icon}
              </span>
              <span className="intensity-edit-number">{intensity.level}</span>
              <span className="intensity-edit-label">{intensity.label}</span>
            </button>
          ))}
        </div>

        <div className="intensity-edit-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Annuler
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
