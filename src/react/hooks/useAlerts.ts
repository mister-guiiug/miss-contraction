import { useMemo, useState, useCallback, useEffect } from 'react';
import type { AppSettings, ContractionRecord } from '../../storage';
import {
  computeThresholdBadge,
  type ThresholdBadgeKind,
} from '../../statsHelpers';
import { loadSnoozeUntil } from '../../storage';
import { vibrate } from './useWakeLock';
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

  // Vibration si le seuil critique est atteint
  useEffect(() => {
    if (thresholdKind === 'match' && settings.vibrationEnabled) {
      vibrate([100, 50, 100, 50, 100], true);
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
