import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useAlerts } from '../../hooks/useAlerts';
import { KEY_EXPORT_NUDGE_DISMISSED } from '../../../storage';

const EXPORT_NUDGE_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 jours
const UNDO_MS = 30_000;

export function Banners() {
  const { records, settings, deleteRecord, setAlertLatch } = useAppStore();
  const { showPreAlertBanner, dismissPreAlertBanner } = useAlerts(
    records,
    settings
  );
  const [showExportNudge, setShowExportNudge] = useState(false);

  // Undo state
  const [undoState, setUndoState] = useState<{
    visible: boolean;
    remainingTime: number;
    recordId: string | null;
  }>({ visible: false, remainingTime: 0, recordId: null });
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Vérifier le bandeau export nudge
  useEffect(() => {
    const all = records.filter((r) => r.end > r.start);
    if (all.length === 0) {
      setShowExportNudge(false);
      return;
    }

    let dismissedAt = 0;
    try {
      dismissedAt = Number(localStorage.getItem(KEY_EXPORT_NUDGE_DISMISSED)) || 0;
    } catch {
      dismissedAt = 0;
    }
    setShowExportNudge(Date.now() - dismissedAt >= EXPORT_NUDGE_INTERVAL_MS);
  }, [records]);

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

  const showUndoBanner = useCallback((recordId: string) => {
    // Nettoyer l'état précédent
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);

    let remaining = UNDO_MS / 1000;

    setUndoState({ visible: true, remainingTime: remaining, recordId });

    // Mise à jour chaque seconde
    undoTimerRef.current = setInterval(() => {
      remaining -= 1;
      setUndoState((prev) => ({ ...prev, remainingTime: remaining }));
    }, 1000);

    // Masquer après 30s
    undoTimeoutRef.current = setTimeout(() => {
      hideUndoBanner();
    }, UNDO_MS);
  }, []);

  const hideUndoBanner = useCallback(() => {
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimerRef.current = null;
    undoTimeoutRef.current = null;
    setUndoState({ visible: false, remainingTime: 0, recordId: null });
  }, []);

  useEffect(() => {
    // Ne montrer la bannière que si un NOUVEAU record a été ajouté
    // (ignore les suppressions et modifications)
    if (records.length > lastCountRef.current) {
      const last = records[records.length - 1];
      if (last && last.id !== lastRecordIdRef.current) {
        lastRecordIdRef.current = last.id;
        lastCountRef.current = records.length;
        showUndoBanner(last.id);
      }
    } else {
      // Mise à jour du compteur sans afficher la bannière (suppression ou modification)
      lastCountRef.current = records.length;
      if (records.length > 0) {
        lastRecordIdRef.current = records[records.length - 1].id;
      }
    }
  }, [records, showUndoBanner]);

  const handleUndo = useCallback(() => {
    const recordId = undoState.recordId;
    if (recordId) {
      hideUndoBanner();
      deleteRecord(recordId);
      setAlertLatch(false);
    }
  }, [undoState.recordId, deleteRecord, setAlertLatch, hideUndoBanner]);

  const dismissExportNudge = useCallback(() => {
    try {
      localStorage.setItem(KEY_EXPORT_NUDGE_DISMISSED, String(Date.now()));
    } catch {
      /* ignore */
    }
    setShowExportNudge(false);
  }, []);

  // Pré-alerte (priorité la plus haute)
  if (showPreAlertBanner) {
    return (
      <div className="app-banner app-banner--accent" id="banner-pre-alert">
        <p className="app-banner-text" id="banner-pre-alert-text">
          Rythme qui se resserre — restez attentive aux consignes de votre sage-femme.
        </p>
        <button
          type="button"
          className="btn btn-ghost btn-small"
          id="btn-dismiss-pre"
          onClick={dismissPreAlertBanner}
        >
          Fermer
        </button>
      </div>
    );
  }

  // Undo banner (priorité moyenne)
  if (undoState.visible) {
    return (
      <div className="app-banner app-banner--info banner-undo" id="banner-undo">
        <div className="banner-undo-top">
          <span className="app-banner-text">Enregistré !</span>
          <button
            type="button"
            className="btn btn-ghost btn-small"
            id="btn-undo-add"
            onClick={handleUndo}
          >
            Annuler
          </button>
        </div>
        <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
          {undoState.remainingTime}s restantes
        </p>
      </div>
    );
  }

  // Export nudge (priorité basse)
  if (showExportNudge) {
    return (
      <div className="app-banner app-banner--muted" id="banner-export-nudge">
        <span className="app-banner-text">
          Pensez à exporter une sauvegarde (Partager / Exporter) avant un changement de téléphone.
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-small"
          id="btn-dismiss-export-nudge"
          onClick={dismissExportNudge}
        >
          Plus tard
        </button>
      </div>
    );
  }

  return null;
}
