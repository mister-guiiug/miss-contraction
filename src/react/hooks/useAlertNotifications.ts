import { useEffect, useMemo, useRef } from 'react';
import {
  alertToNotify,
  buildAlertNotification,
  showAlertNotification,
} from '../../alertNotifications';
import {
  computeThresholdBadge,
  type ThresholdBadgeKind,
} from '../../statsHelpers';
import { loadSnoozeUntil } from '../../storage';
import { useAppStore } from '../store/useAppStore';

/**
 * Notifie quand l'état du seuil CHANGE vers une alerte.
 *
 * MONTÉ AU NIVEAU DE L'APPLICATION, PAS DE L'ACCUEIL. `useAlerts` vit dans
 * `Banners`, qui n'existe que sur l'accueil : une contraction modifiée depuis
 * le tableau, ou arrivée d'un autre onglet, franchirait le seuil sans que
 * personne le voie.
 *
 * Le premier passage s'aligne sans notifier : rouvrir l'application sur un
 * seuil déjà atteint ne doit pas renvoyer la notification à chaque fois.
 */
export function useAlertNotifications(): void {
  const records = useAppStore(state => state.records);
  const settings = useAppStore(state => state.settings);
  const kind = useMemo(
    () => computeThresholdBadge(records, settings),
    [records, settings]
  );
  const previous = useRef<ThresholdBadgeKind | null>(null);

  useEffect(() => {
    const before = previous.current;
    previous.current = kind;
    if (before === null) return;

    const which = alertToNotify(
      before,
      kind,
      settings,
      Date.now() < loadSnoozeUntil()
    );
    if (!which) return;
    void showAlertNotification(
      buildAlertNotification(which, {
        language: settings.language,
        consecutiveCount: settings.consecutiveCount,
        vibrationEnabled: settings.vibrationEnabled,
      })
    );
  }, [kind, settings]);
}
