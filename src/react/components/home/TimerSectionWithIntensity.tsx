import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useContractionTimer } from '../../hooks/useContractionTimer';
import { useRestTimer } from '../../hooks/useRestTimer';
import { useWakeLock, vibrate } from '../../hooks/useWakeLock';
import { IntensityPicker } from './IntensityPicker';
import { QuickNotes } from './QuickNotes';
import { interpolate, t } from '../../../i18n';

interface TimerSectionProps {
  onNoteSelect?: (note: string) => void;
  selectedNote?: string | null;
  onClearNote?: () => void;
}

/**
 * Timer principal amélioré avec sélecteur d'intensité intégré
 */
export function TimerSectionWithIntensity({
  onNoteSelect,
  selectedNote,
  onClearNote,
}: TimerSectionProps) {
  const { records, activeStart, settings, startContraction, endContraction } =
    useAppStore();
  const language = settings.language;
  const { formatted, progress, isRunning } = useContractionTimer(activeStart);

  const lastEnd = useMemo(() => {
    if (records.length === 0) return null;
    return records[records.length - 1].end;
  }, [records]);

  const { formatted: restFormatted } = useRestTimer(lastEnd);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripplePosition, setRipplePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [currentIntensity, setCurrentIntensity] = useState<number | undefined>(
    undefined
  );

  useWakeLock(settings.keepAwakeDuringContraction, isRunning);

  // Gérer le mode focus pendant contraction
  useEffect(() => {
    if (isRunning) {
      document.body.classList.add('contraction-active');
    } else {
      document.body.classList.remove('contraction-active');
    }
    return () => {
      document.body.classList.remove('contraction-active');
    };
  }, [isRunning]);

  // Réinitialiser l'intensité quand une contraction commence
  useEffect(() => {
    if (isRunning && currentIntensity === undefined) {
      setCurrentIntensity(3); // Valeur par défaut
    } else if (!isRunning) {
      setCurrentIntensity(undefined);
    }
  }, [isRunning, currentIntensity]);

  const handleToggle = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Créer l'effet ripple
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setRipplePosition({ x, y });

      // Retirer le ripple après l'animation
      setTimeout(() => setRipplePosition(null), 600);

      if (isRunning) {
        // Enregistrer l'intensité et la note avant de terminer
        vibrate([35, 50, 35], settings.vibrationEnabled);
        endContraction(selectedNote || undefined, currentIntensity);
        if (onClearNote) onClearNote();
      } else {
        vibrate(40, settings.vibrationEnabled);
        startContraction();
      }
    },
    [
      isRunning,
      settings.vibrationEnabled,
      startContraction,
      endContraction,
      currentIntensity,
    ]
  );

  const handleIntensityChange = useCallback(
    (intensity: number) => {
      setCurrentIntensity(intensity);
      // Feedback haptique léger au changement d'intensité
      if (settings.vibrationEnabled) {
        vibrate(20, true);
      }
    },
    [settings.vibrationEnabled]
  );

  const circumference = 2 * Math.PI * 90;
  const offset = circumference * (1 - progress);

  return (
    <section
      className="card panel panel-cta"
      aria-labelledby="action-heading"
      data-testid="timer-section-with-intensity"
    >
      <h2 id="action-heading" className="cta-heading">
        {t(language, 'timer.title')}
      </h2>
      <p className="cta-hint">{t(language, 'timer.hint')}</p>

      {!isRunning && lastEnd && (
        <div className="rest-timer" data-testid="rest-timer">
          <p className="rest-timer-label">{t(language, 'timer.restSince')}</p>
          <p className="rest-timer-value">{restFormatted}</p>
        </div>
      )}

      {isRunning && (
        <div className="timer" id="timer-block" data-testid="timer-display">
          <p className="timer-label">{t(language, 'timer.running')}</p>
          <div className="timer-circle-container">
            <svg
              className="timer-circle"
              viewBox="0 0 200 200"
              aria-hidden="true"
            >
              <circle className="timer-circle-bg" cx="100" cy="100" r="90" />
              <circle
                className="timer-circle-progress"
                cx="100"
                cy="100"
                r="90"
                style={{
                  strokeDashoffset: String(offset),
                  strokeDasharray: String(circumference),
                }}
              />
            </svg>
            <div className="timer-pulse" />
            <p className="timer-value" data-testid="timer-value">
              {formatted}
            </p>
          </div>

          {/* Sélecteur d'intensité pendant contraction */}
          <div className="timer-intensity-section">
            <p className="timer-intensity-label">
              {t(language, 'timer.intensity')}
            </p>
            <div data-testid="intensity-selector">
              <IntensityPicker
                value={currentIntensity}
                onChange={handleIntensityChange}
                compact={true}
              />
            </div>
          </div>
        </div>
      )}

      <div className="actions actions-cta">
        <button
          ref={buttonRef}
          type="button"
          className={`btn btn-cta btn-cta-enhanced ${isRunning ? 'btn-danger recording' : 'btn-primary'}`}
          id="btn-toggle"
          data-testid="toggle-contraction-btn"
          onClick={handleToggle}
          aria-live="polite"
          style={{ position: 'relative', overflow: 'hidden' }}
        >
          {isRunning ? t(language, 'timer.end') : t(language, 'timer.start')}
          {ripplePosition && (
            <span
              className="ripple"
              style={{
                left: ripplePosition.x,
                top: ripplePosition.y,
              }}
            />
          )}
        </button>
      </div>

      <div className="timer-quick-notes">
        <QuickNotes onNoteSelect={onNoteSelect} />
      </div>

      <p className="hint" id="status-hint" data-testid="timer-hint">
        {isRunning
          ? currentIntensity
            ? interpolate(t(language, 'timer.statusWithIntensity'), {
                intensity: currentIntensity,
              })
            : t(language, 'timer.status')
          : ''}
      </p>
    </section>
  );
}
