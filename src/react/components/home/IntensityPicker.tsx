import { useCallback, useState } from 'react';
import { INTENSITY_DATA } from '../../../utils/intensity';
import { useAppStore } from '../../store/useAppStore';
import { interpolate, t } from '../../../i18n';

interface IntensityPickerProps {
  value?: number;
  onChange: (intensity: number) => void;
  disabled?: boolean;
  /** Pastilles resserrées — la seule taille montée aujourd'hui. */
  compact?: boolean;
}

/**
 * L'échelle d'intensité, de 1 à 5.
 *
 * CE QUE « 3 » VEUT DIRE EST ÉCRIT, PAS SURVOLÉ. Le sens de chaque niveau —
 * « Soutenu — requiert de la concentration » — ne vivait que dans une infobulle
 * au survol. Sur un téléphone il n'y a pas de survol : l'utilisatrice voyait un
 * émoji et un chiffre, et devait deviner le reste. C'est précisément l'écran
 * qu'elle regarde en pleine contraction, pour une échelle subjective dont la
 * valeur repart ensuite dans le document remis à la sage-femme.
 *
 * L'infobulle était même inatteignable À LA SOURIS : son rendu était barré par
 * `!compact`, et le seul appelant passe `compact={true}`. Elle n'a donc jamais
 * été montrée à personne, sur aucun appareil.
 *
 * La ligne sous l'échelle dit le niveau visé : celui qu'on survole ou qu'on
 * parcourt au clavier s'il y en a un, sinon celui qui est sélectionné. Elle
 * garde sa hauteur quand elle est vide — sinon le gros bouton sauterait au
 * premier survol.
 */
export function IntensityPicker({
  value,
  onChange,
  disabled = false,
  compact = false,
}: IntensityPickerProps) {
  const [previewed, setPreviewed] = useState<number | null>(null);
  const language = useAppStore(state => state.settings.language);

  const handleSelect = useCallback(
    (level: number) => {
      if (!disabled) {
        onChange(level);
      }
    },
    [disabled, onChange]
  );

  const affiche = previewed ?? value ?? null;

  return (
    <div
      className={`intensity-picker ${compact ? 'intensity-picker--compact' : ''}`}
      data-testid="intensity-picker"
    >
      <div className="intensity-scale">
        {INTENSITY_DATA.map(intensity => {
          const isSelected = value === intensity.level;

          return (
            <button
              key={intensity.level}
              type="button"
              className={`intensity-option ${isSelected ? 'intensity-option--selected' : ''}`}
              data-testid={`intensity-option-${intensity.level}`}
              onClick={() => handleSelect(intensity.level)}
              onMouseEnter={() => setPreviewed(intensity.level)}
              onMouseLeave={() => setPreviewed(null)}
              onFocus={() => setPreviewed(intensity.level)}
              onBlur={() => setPreviewed(null)}
              disabled={disabled}
              style={
                {
                  '--intensity-color': intensity.color,
                } as React.CSSProperties
              }
              aria-label={interpolate(t(language, 'intensity.aria'), {
                level: intensity.level,
                label: t(language, `intensity.${intensity.level}.label`),
              })}
              aria-pressed={isSelected}
            >
              <span
                className="intensity-option-icon"
                style={{ fontSize: '1.5rem' }}
              >
                {intensity.emoji}
              </span>
              <span className="intensity-option-label">{intensity.level}</span>
            </button>
          );
        })}
      </div>

      {/*
       * `aria-hidden` : un lecteur d'écran a déjà le niveau et son nom dans
       * l'`aria-label` du bouton, à la seconde où il le parcourt. Répéter ici
       * ferait entendre deux fois la même chose.
       */}
      <p
        className="intensity-current"
        data-testid="intensity-description"
        aria-hidden="true"
      >
        {affiche != null && (
          <>
            <strong>{t(language, `intensity.${affiche}.label`)}</strong>
            {' — '}
            {t(language, `intensity.${affiche}.desc`)}
          </>
        )}
      </p>

      <div className="intensity-legend">
        <span className="intensity-legend-start">
          {t(language, 'intensity.legendStart')}
        </span>
        {/*
         * Les cinq arrêts lisent les tokens, ils ne les recopient plus. Les
         * hex étaient écrits ici en dur : changer une couleur dans
         * `styles.css` désaccordait le dégradé des pastilles qu'il illustre.
         * `var()` ne se résout pas dans un attribut de présentation SVG — il
         * faut passer par la propriété CSS, d'où `style`.
         */}
        <svg
          className="intensity-legend-bar"
          viewBox="0 0 200 8"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="intensityGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              {INTENSITY_DATA.map((intensity, i) => (
                <stop
                  key={intensity.level}
                  offset={`${(i / (INTENSITY_DATA.length - 1)) * 100}%`}
                  style={{ stopColor: intensity.color }}
                />
              ))}
            </linearGradient>
          </defs>
          <rect width="200" height="8" fill="url(#intensityGradient)" rx="4" />
        </svg>
        <span className="intensity-legend-end">
          {t(language, 'intensity.legendEnd')}
        </span>
      </div>
    </div>
  );
}
