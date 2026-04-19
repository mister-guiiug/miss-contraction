import { useAppStore } from '../../store/useAppStore';
import { useContractionTimer } from '../../hooks/useContractionTimer';
import { useWakeLock, vibrate } from '../../hooks/useWakeLock';

export function TimerSection() {
  const { activeStart, settings, startContraction, endContraction } = useAppStore();
  const { formatted, progress, isRunning } = useContractionTimer(activeStart);

  useWakeLock(settings.keepAwakeDuringContraction, isRunning);

  const handleToggle = () => {
    if (isRunning) {
      vibrate([35, 50, 35], settings.vibrationEnabled);
      endContraction();
    } else {
      vibrate(40, settings.vibrationEnabled);
      startContraction();
    }
  };

  const circumference = 2 * Math.PI * 90;
  const offset = circumference * (1 - progress);

  return (
    <section className="card panel panel-cta" aria-labelledby="action-heading">
      <h2 id="action-heading" className="cta-heading">Enregistrer une contraction</h2>
      <p className="cta-hint">
        Touchez le gros bouton au <strong>début</strong> d'une contraction, puis à nouveau à la <strong>fin</strong>.
      </p>

      {isRunning && (
        <div className="timer" id="timer-block">
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
            <p className="timer-value">{formatted}</p>
          </div>
        </div>
      )}

      <div className="actions actions-cta">
        <button
          type="button"
          className={`btn btn-cta btn-cta-enhanced ${isRunning ? 'btn-danger recording' : 'btn-primary'}`}
          id="btn-toggle"
          onClick={handleToggle}
          aria-live="polite"
        >
          {isRunning ? 'Fin de contraction' : 'Début de contraction'}
        </button>
      </div>

      <p className="hint" id="status-hint">
        {isRunning
          ? 'Appuyez à nouveau à la fin de la contraction.'
          : ''}
      </p>
    </section>
  );
}
