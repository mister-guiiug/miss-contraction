import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useContractionTimer } from '../../hooks/useContractionTimer';
import { useWakeLock, vibrate } from '../../hooks/useWakeLock';
import { IntensityPicker } from './IntensityPicker';

/**
 * Timer principal amélioré avec sélecteur d'intensité intégré
 */
export function TimerSectionWithIntensity() {
  const { activeStart, settings, startContraction, endContraction } = useAppStore();
  const { formatted, progress, isRunning } = useContractionTimer(activeStart);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripplePosition, setRipplePosition] = useState<{ x: number; y: number } | null>(null);
  const [currentIntensity, setCurrentIntensity] = useState<number | undefined>(undefined);

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

  const handleToggle = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Créer l'effet ripple
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipplePosition({ x, y });

    // Retirer le ripple après l'animation
    setTimeout(() => setRipplePosition(null), 600);

    if (isRunning) {
      // Enregistrer l'intensité avant de terminer
      vibrate([35, 50, 35], settings.vibrationEnabled);
      endContraction(undefined, currentIntensity);
    } else {
      vibrate(40, settings.vibrationEnabled);
      startContraction();
    }
  }, [isRunning, settings.vibrationEnabled, startContraction, endContraction, currentIntensity]);

  const handleIntensityChange = useCallback((intensity: number) => {
    setCurrentIntensity(intensity);
    // Feedback haptique léger au changement d'intensité
    if (settings.vibrationEnabled) {
      vibrate(20, true);
    }
  }, [settings.vibrationEnabled]);

  const circumference = 2 * Math.PI * 90;
  const offset = circumference * (1 - progress);

  return (
    <section className="card panel panel-cta" aria-labelledby="action-heading" data-testid="timer-section-with-intensity">
      <h2 id="action-heading" className="cta-heading">Enregistrer une contraction</h2>
      <p className="cta-hint">
        Touchez le gros bouton au <strong>début</strong> d'une contraction, puis à la <strong>fin</strong>.
      </p>

      {isRunning && (
        <div className="timer" id="timer-block" data-testid="timer-display">
          <p className="timer-label">Contraction en cours</p>
          <div className="timer-circle-container">
            <svg className="timer-circle" viewBox="0 0 200 200" aria-hidden="true">
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
            <p className="timer-value" data-testid="timer-value">{formatted}</p>
          </div>

          {/* Sélecteur d'intensité pendant contraction */}
          <div className="timer-intensity-section">
            <p className="timer-intensity-label">Intensité de cette contraction :</p>
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
          {isRunning ? 'Fin de contraction' : 'Début de contraction'}
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

      <p className="hint" id="status-hint" data-testid="timer-hint">
        {isRunning
          ? `Appuyez à la fin. Intensité${currentIntensity ? ` : ${currentIntensity}/5` : ''}`
          : ''}
      </p>
    </section>
  );
}
