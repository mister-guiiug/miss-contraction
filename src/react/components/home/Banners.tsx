import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAlerts } from '../../hooks/useAlerts';
import { KEY_EXPORT_NUDGE_DISMISSED } from '../../../storage';
import { interpolate, t } from '../../../i18n';

const EXPORT_NUDGE_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours
const UNDO_MS = 30_000;

export function Banners() {
  const { records, settings, deleteRecord, setAlertLatch } = useAppStore();
  const language = settings.language;
  const { showPreAlertBanner, dismissPreAlertBanner } = useAlerts(
    records,
    settings
  );
  const [showExportNudge, setShowExportNudge] = useState<boolean>(() => {
    try {
      const dismissedAt =
        Number(localStorage.getItem(KEY_EXPORT_NUDGE_DISMISSED)) || 0;
      return Date.now() - dismissedAt >= EXPORT_NUDGE_INTERVAL_MS;
    } catch {
      return true;
    }
  });

  // Undo state
  const [undoState, setUndoState] = useState<{
    visible: boolean;
    remainingTime: number;
    recordId: string | null;
  }>({ visible: false, remainingTime: 0, recordId: null });
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasValidRecords = records.some(r => r.end > r.start);

  // Afficher undo banner quand une contraction est ajoutée (pas supprimée)
  const lastRecordIdRef = useRef<string | null>(null);
  const lastCountRef = useRef<number>(0);

  // Nettoyer les timers au unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearInterval(undoTimerRef.current);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  const hideUndoBanner = () => {
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimerRef.current = null;
    undoTimeoutRef.current = null;
    setUndoState({ visible: false, remainingTime: 0, recordId: null });
  };

  useEffect(() => {
    // Ne montrer la bannière que si un NOUVEAU record a été ajouté
    // (ignore les suppressions et modifications)
    if (records.length > lastCountRef.current) {
      const last = records[records.length - 1];
      if (last && last.id !== lastRecordIdRef.current) {
        lastRecordIdRef.current = last.id;
        lastCountRef.current = records.length;

        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
        if (undoTimerRef.current) clearInterval(undoTimerRef.current);

        let remaining = UNDO_MS / 1000;
        setUndoState({
          visible: true,
          remainingTime: remaining,
          recordId: last.id,
        });

        undoTimerRef.current = setInterval(() => {
          remaining -= 1;
          setUndoState(prev => ({ ...prev, remainingTime: remaining }));
        }, 1000);

        undoTimeoutRef.current = setTimeout(() => {
          if (undoTimerRef.current) clearInterval(undoTimerRef.current);
          if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
          undoTimerRef.current = null;
          undoTimeoutRef.current = null;
          setUndoState({ visible: false, remainingTime: 0, recordId: null });
        }, UNDO_MS);
      }
    } else {
      // Mise à jour du compteur sans afficher la bannière (suppression ou modification)
      lastCountRef.current = records.length;
      const lastRecord = records[records.length - 1];
      if (lastRecord) {
        lastRecordIdRef.current = lastRecord.id;
      }
    }
  }, [records]);

  const handleUndo = () => {
    const recordId = undoState.recordId;
    if (recordId) {
      hideUndoBanner();
      deleteRecord(recordId);
      setAlertLatch(false);
    }
  };

  const dismissExportNudge = () => {
    try {
      localStorage.setItem(KEY_EXPORT_NUDGE_DISMISSED, String(Date.now()));
    } catch {
      /* ignore */
    }
    setShowExportNudge(false);
  };

  // Pré-alerte (priorité la plus haute)
  if (showPreAlertBanner) {
    return (
      <div className="app-banner app-banner--accent" id="banner-pre-alert">
        <p className="app-banner-text" id="banner-pre-alert-text">
          {t(language, 'banner.preAlert')}
        </p>
        <button
          type="button"
          className="btn btn-ghost btn-small"
          id="btn-dismiss-pre"
          onClick={dismissPreAlertBanner}
        >
          {t(language, 'banner.close')}
        </button>
      </div>
    );
  }

  // Undo banner (priorité moyenne)
  if (undoState.visible) {
    return (
      <div className="app-banner app-banner--info banner-undo" id="banner-undo">
        <div className="banner-undo-top">
          <span className="app-banner-text">{t(language, 'banner.saved')}</span>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            id="btn-undo-add"
            onClick={handleUndo}
          >
            {t(language, 'banner.undo')}
          </button>
        </div>
        <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
          {interpolate(t(language, 'banner.secondsLeft'), {
            seconds: undoState.remainingTime,
          })}
        </p>
      </div>
    );
  }

  // Export nudge (priorité basse)
  if (hasValidRecords && showExportNudge) {
    return (
      <div className="app-banner app-banner--muted" id="banner-export-nudge">
        <span className="app-banner-text">
          {t(language, 'banner.exportNudge')}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-small"
          id="btn-dismiss-export-nudge"
          onClick={dismissExportNudge}
        >
          {t(language, 'banner.later')}
        </button>
      </div>
    );
  }

  return null;
}
