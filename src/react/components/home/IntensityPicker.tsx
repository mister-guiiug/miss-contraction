import { useState, useCallback, useMemo } from 'react';

interface IntensityPickerProps {
  value?: number;
  onChange: (intensity: number) => void;
  disabled?: boolean;
  compact?: boolean;
}

/**
 * Sélecteur d'intensité des contractions avec icônes modernes
 * Niveaux de 1 (léger) à 5 (très intense)
 */
export function IntensityPicker({ value, onChange, disabled = false, compact = false }: IntensityPickerProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const intensities = useMemo(() => [
    {
      level: 1,
      label: 'Léger',
      description: 'Peu perceptible',
      color: '#80c878',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="12" r="5" opacity="0.25" />
        </svg>
      ),
    },
    {
      level: 2,
      label: 'Modéré',
      description: 'Gérable',
      color: '#a8d678',
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
      label: 'Soutenu',
      description: 'Requiert de la concentration',
      color: '#ffd04b',
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
      label: 'Fort',
      description: 'Difficile à supporter',
      color: '#ff9d4b',
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
      label: 'Très fort',
      description: 'Maximum',
      color: '#ff5e4b',
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

  const handleSelect = useCallback((level: number) => {
    if (!disabled) {
      onChange(level);
    }
  }, [disabled, onChange]);

  return (
    <div className={`intensity-picker ${compact ? 'intensity-picker--compact' : ''}`} data-testid="intensity-picker">
      <div className="intensity-scale">
        {intensities.map((intensity) => {
          const isSelected = value === intensity.level;
          const isHovered = hovered === intensity.level;

          return (
            <button
              key={intensity.level}
              type="button"
              className={`intensity-option ${isSelected ? 'intensity-option--selected' : ''}`}
              data-testid={`intensity-option-${intensity.level}`}
              onClick={() => handleSelect(intensity.level)}
              onMouseEnter={() => setHovered(intensity.level)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(intensity.level)}
              onBlur={() => setHovered(null)}
              disabled={disabled}
              style={{
                '--intensity-color': intensity.color,
              } as React.CSSProperties}
              aria-label={`Intensité ${intensity.level} : ${intensity.label}`}
              aria-pressed={isSelected}
            >
              <span className="intensity-option-icon">
                {intensity.icon}
              </span>
              <span className="intensity-option-label">{intensity.level}</span>
              {isHovered && !compact && (
                <span className="intensity-option-tooltip">
                  {intensity.label} — {intensity.description}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Légende de l'échelle */}
      <div className="intensity-legend">
        <span className="intensity-legend-start">Léger</span>
        <svg className="intensity-legend-bar" viewBox="0 0 200 8" preserveAspectRatio="none">
          <defs>
            <linearGradient id="intensityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#80c878" />
              <stop offset="25%" stopColor="#a8d678" />
              <stop offset="50%" stopColor="#ffd04b" />
              <stop offset="75%" stopColor="#ff9d4b" />
              <stop offset="100%" stopColor="#ff5e4b" />
            </linearGradient>
          </defs>
          <rect width="200" height="8" fill="url(#intensityGradient)" rx="4" />
        </svg>
        <span className="intensity-legend-end">Maximum</span>
      </div>
    </div>
  );
}
