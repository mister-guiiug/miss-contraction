import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';

/**
 * Badge d'état du seuil avec animation et indicateur visuel
 */
export function ThresholdBadge() {
  const { records, settings } = useAppStore();

  const { state, message, consecutiveBelow, totalNeeded } = useMemo(() => {
    if (records.length === 0) {
      return {
        state: 'empty' as const,
        message: 'Aucune contraction enregistrée',
        consecutiveBelow: 0,
        totalNeeded: settings.consecutiveCount,
      };
    }

    // Filtrer selon la fenêtre de statistiques
    const now = Date.now();
    const windowMs = settings.statsWindowMinutes === 'all'
      ? Infinity
      : settings.statsWindowMinutes * 60 * 1000;

    const filtered = records.filter((r) => now - r.start <= windowMs);

    // Vérifier les contractions consécutives sous le seuil
    let consecutiveCount = 0;
    const maxIntervalSec = settings.maxIntervalMin * 60;
    const minDurationSec = settings.minDurationSec;

    // Parcourir du plus récent au plus ancien
    for (let i = filtered.length - 1; i >= 0; i--) {
      const record = filtered[i];
      const durationSec = (record.end - record.start) / 1000;

      // Vérifier la durée minimale
      if (durationSec < minDurationSec) continue;

      // Vérifier l'intervalle avec la contraction précédente
      if (i > 0) {
        const interval = (record.start - filtered[i - 1].start) / 1000;
        if (interval > maxIntervalSec) break;
      }

      consecutiveCount++;
      if (consecutiveCount >= settings.consecutiveCount) break;
    }

    if (consecutiveCount >= settings.consecutiveCount) {
      return {
        state: 'match' as const,
        message: `✓ Seuil atteint ! (${consecutiveCount}/${settings.consecutiveCount} contractions)`,
        consecutiveBelow: consecutiveCount,
        totalNeeded: settings.consecutiveCount,
      };
    }

    if (consecutiveCount >= Math.ceil(settings.consecutiveCount / 2)) {
      return {
        state: 'approaching' as const,
        message: `Presque... (${consecutiveCount}/${settings.consecutiveCount} contractions sous le seuil)`,
        consecutiveBelow: consecutiveCount,
        totalNeeded: settings.consecutiveCount,
      };
    }

    return {
      state: 'calm' as const,
      message: `${consecutiveCount}/${settings.consecutiveCount} contractions sous le seuil`,
      consecutiveBelow: consecutiveCount,
      totalNeeded: settings.consecutiveCount,
    };
  }, [records, settings]);

  return (
    <div
      className="threshold-badge"
      data-state={state}
      style={{
        textAlign: 'center',
        marginTop: '0.5rem',
      }}
    >
      {(state === 'match' || state === 'approaching') && (
        <span className="threshold-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            width="20"
            height="20"
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 6v6l4 2" />
          </svg>
        </span>
      )}
      {message}
    </div>
  );
}
