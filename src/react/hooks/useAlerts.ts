import { useMemo, useState, useCallback, useEffect } from 'react';
import type { AppSettings, ContractionRecord } from '../../storage';
import {
  computeThresholdBadge,
  type ThresholdBadgeKind,
} from '../../statsHelpers';
import { loadSnoozeUntil } from '../../storage';
import { vibrate } from '@mister-guiiug/dev-wpa-config/haptics';
import { useNow } from './useNow';

interface AlertState {
  thresholdKind: ThresholdBadgeKind;
  isSnoozed: boolean;
  showPreAlertBanner: boolean;
  dismissPreAlertBanner: () => void;
}

export function useAlerts(
  records: ContractionRecord[],
  settings: AppSettings
): AlertState {
  const [preAlertBannerDismissed, setPreAlertBannerDismissed] = useState(false);
  const now = useNow(1000);

  const thresholdKind = useMemo(
    () => computeThresholdBadge(records, settings),
    [records, settings]
  );

  // Vibration si le seuil critique est atteint : trois pulsations longues,
  // le dernier échelon du vocabulaire haptique de l'app (1 = début, 2 = fin,
  // 3 = seuil atteint). Motif explicite plutôt qu'un `HAPTIC_PATTERNS` nommé :
  // c'est l'alerte « il est temps de partir à la maternité », ressentie
  // pendant une contraction, et aucun pattern du socle ne tape aussi fort
  // (`error` plafonne à 70 ms par pulsation).
  useEffect(() => {
    if (thresholdKind === 'match' && settings.vibrationEnabled) {
      vibrate([100, 50, 100, 50, 100]);
    }
  }, [thresholdKind, settings.vibrationEnabled]);

  const isSnoozed = useMemo(() => {
    return now < loadSnoozeUntil();
  }, [now]);

  const showPreAlertBanner = useMemo(() => {
    return (
      settings.preAlertEnabled &&
      thresholdKind === 'approaching' &&
      !preAlertBannerDismissed &&
      !isSnoozed
    );
  }, [
    settings.preAlertEnabled,
    thresholdKind,
    preAlertBannerDismissed,
    isSnoozed,
  ]);

  const dismissPreAlertBanner = useCallback(() => {
    setPreAlertBannerDismissed(true);
  }, []);

  return {
    thresholdKind,
    isSnoozed,
    showPreAlertBanner,
    dismissPreAlertBanner,
  };
}

export function shouldShowPreAlertBanner(
  settings: AppSettings,
  thresholdKind: ThresholdBadgeKind,
  isSnoozed: boolean
): boolean {
  return (
    settings.preAlertEnabled && thresholdKind === 'approaching' && !isSnoozed
  );
}
