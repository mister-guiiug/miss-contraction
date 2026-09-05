import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useContractionTimer } from '../../hooks/useContractionTimer';
import { useRestTimer } from '../../hooks/useRestTimer';
import { useWakeLock } from '@mister-guiiug/dev-pwa-config/react/use-wake-lock';
import { vibrate } from '@mister-guiiug/dev-pwa-config/haptics';
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
    const last = records[records.length - 1];
    return last ? last.end : null;
  }, [records]);

  const [restStartMs, setRestStartMs] = useState<number | null>(lastEnd);
  const [isRestPaused, setIsRestPaused] = useState(false);
  // Réinitialise le minuteur de repos quand la dernière contraction change —
  // pendant le RENDU (pattern « ajuster l'état au rendu » des docs React),
  // plutôt qu'un setState dans un effect. Entre deux changements, l'utilisateur
  // garde la main (boutons « Redémarrer » / « Pause »).
  const [prevLastEnd, setPrevLastEnd] = useState<number | null>(lastEnd);
  if (prevLastEnd !== lastEnd) {
    setPrevLastEnd(lastEnd);
    setRestStartMs(lastEnd);
    setIsRestPaused(false);
  }
  const { formatted: restFormatted } = useRestTimer(restStartMs, isRestPaused);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripplePosition, setRipplePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  // Une contraction restaurée après rechargement repart sur la même intensité
  // par défaut qu'une contraction démarrée à la main (`handleToggle` pose 3).
  // Sans ça, elle s'enregistrerait à 2 — le repli de `endContraction`.
  const [currentIntensity, setCurrentIntensity] = useState<number | undefined>(
    activeStart === null ? undefined : 3
  );

  // Écran allumé pendant une contraction — uniquement si le réglage
  // « garder l'écran allumé » est actif.
  useWakeLock(settings.keepAwakeDuringContraction && isRunning);

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

  const handleToggle = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Créer l'effet ripple
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setRipplePosition({ x, y });

      // Retirer le ripple après l'animation
      setTimeout(() => setRipplePosition(null), 600);

      // Motifs explicites plutôt que des `HAPTIC_PATTERNS` nommés : début et
      // fin sont les deux actions majeures de l'app, déclenchées en pleine
      // contraction sans regarder l'écran. Le nombre de pulsations les
      // distingue (1 = début, 2 = fin, 3 = seuil atteint dans `useAlerts`) ;
      // `confirm` et `success` sont deux pulsations uniques, ce qui aplatirait
      // ce vocabulaire — et `confirm` (18 ms) passerait sous le seuil du
      // « retour haptique clair » exigé par AGENTS.md.
      if (isRunning) {
        // Enregistrer l'intensité et la note avant de terminer
        if (settings.vibrationEnabled) vibrate([35, 50, 35]);
        endContraction(selectedNote || undefined, currentIntensity);
        setCurrentIntensity(undefined);
        if (onClearNote) onClearNote();
      } else {
        setCurrentIntensity(3);
        if (settings.vibrationEnabled) vibrate(40);
        startContraction();
      }
    },
    [
      isRunning,
      settings.vibrationEnabled,
      startContraction,
      endContraction,
      currentIntensity,
      onClearNote,
      selectedNote,
    ]
  );

  const handleIntensityChange = useCallback(
    (intensity: number) => {
      setCurrentIntensity(intensity);
      // Feedback haptique léger au changement d'intensité : simple sélection.
      if (settings.vibrationEnabled) {
        vibrate('tap');
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
          {isRestPaused && (
            <p className="rest-timer-status" data-testid="rest-timer-status">
              {t(language, 'timer.restPaused')}
            </p>
          )}
          <div className="actions" data-testid="rest-timer-actions">
            <button
              type="button"
              className="btn btn-ghost btn-small"
              data-testid="rest-timer-pause-toggle"
              onClick={() => setIsRestPaused(prev => !prev)}
            >
              {isRestPaused
                ? t(language, 'timer.resumeRest')
                : t(language, 'timer.pauseRest')}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-small"
              data-testid="rest-timer-restart"
              onClick={() => {
                setRestStartMs(Date.now());
                setIsRestPaused(false);
              }}
            >
              {t(language, 'timer.restartRest')}
            </button>
          </div>
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
