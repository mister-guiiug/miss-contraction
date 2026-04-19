import { useMemo, useState, useCallback } from 'react';
import type { AppSettings, ContractionRecord } from '../../storage';
import { computeThresholdBadge, type ThresholdBadgeKind } from '../../statsHelpers';
import { loadSnoozeUntil } from '../../storage';

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

  const thresholdKind = useMemo(
    () => computeThresholdBadge(records, settings),
    [records, settings]
  );

  const isSnoozed = useMemo(() => {
    return Date.now() < loadSnoozeUntil();
  }, [records]); // Re-check when records change (on new contraction)

  const showPreAlertBanner = useMemo(() => {
    return (
      settings.preAlertEnabled &&
      thresholdKind === 'approaching' &&
      !preAlertBannerDismissed &&
      !isSnoozed
    );
  }, [settings.preAlertEnabled, thresholdKind, preAlertBannerDismissed, isSnoozed]);

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
  return settings.preAlertEnabled && thresholdKind === 'approaching' && !isSnoozed;
}
