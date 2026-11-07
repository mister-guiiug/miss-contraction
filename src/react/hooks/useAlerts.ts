import { useMemo, useState, useCallback, useEffect } from 'react';
import type { AppSettings, ContractionRecord } from '../../storage';
import {
  computeThresholdBadge,
  type ThresholdBadgeKind,
} from '../../statsHelpers';
import { loadSnoozeUntil } from '../../storage';
import { vibrate } from '@mister-guiiug/dev-pwa-config/haptics';
import { THRESHOLD_VIBRATION } from '../../alertNotifications';
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

  // Vibration si le seuil critique est atteint. Le motif, et pourquoi il est
  // explicite, sont dans `alertNotifications.ts` : la notification le partage.
  useEffect(() => {
    if (thresholdKind === 'match' && settings.vibrationEnabled) {
      vibrate(THRESHOLD_VIBRATION);
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
