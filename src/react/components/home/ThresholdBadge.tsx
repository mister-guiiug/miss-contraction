import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { computeThresholdBadge } from '../../../statsHelpers';
import { t } from '../../../i18n';

const THRESHOLD_KEYS = {
  match: 'stats.threshold.match',
  approaching: 'stats.threshold.approaching',
  calm: 'stats.threshold.calm',
  empty: 'stats.threshold.empty',
} as const;

/**
 * L'état du seuil d'alerte, juste sous le chronomètre.
 *
 * UN SEUL BADGE, ET UN SEUL CALCUL. Ce composant tenait sa propre boucle de
 * comptage pendant que `StatsSection` en affichait un second, alimenté par
 * `computeThresholdBadge` : deux verdicts pouvaient se contredire sur la même
 * page, à deux écrans d'écart. Pire, l'état « seuil atteint » réutilisait
 * `timer.statusWithIntensity` et affichait « Appuyez à la fin. Intensité :
 * 3/3/5 » — au moment précis où il fallait dire de partir.
 */
export function ThresholdBadge() {
  const { records, settings } = useAppStore();
  const language = settings.language;

  const state = useMemo(
    () => computeThresholdBadge(records, settings),
    [records, settings]
  );

  const alerte = state === 'match' || state === 'approaching';

  return (
    <div
      className="threshold-badge"
      data-state={state}
      data-testid="threshold-badge"
      /*
       * `role="status"` et non `aria-live` sur les chiffres voisins : c'est ce
       * message-ci qui doit interrompre, pas la moyenne qui se recalcule.
       */
      role="status"
    >
      {alerte && (
        <span className="threshold-icon" data-testid="threshold-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="20"
            height="20"
            aria-hidden="true"
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 6v6l4 2" />
          </svg>
        </span>
      )}
      <span data-testid="threshold-message">
        {t(language, THRESHOLD_KEYS[state])}
      </span>
    </div>
  );
}
