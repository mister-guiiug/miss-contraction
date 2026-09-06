import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useAlerts } from '../../hooks/useAlerts';
import { BACKUP_SECTION_ID } from '../../views/backupSection';
import { getRoutePath } from '../../../routes-i18n';
import {
  loadExportNudgeDismissedAt,
  setExportNudgeDismissedAt,
} from '../../../storage';
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
    const dismissedAt = loadExportNudgeDismissedAt();
    return Date.now() - dismissedAt >= EXPORT_NUDGE_INTERVAL_MS;
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
  /** Le premier passage de l'effet sert à s'aligner, pas à annoncer un ajout. */
  const amorceRef = useRef<boolean>(false);

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
    /*
     * LE PREMIER PASSAGE NE COMPTE PAS, ET C'EST TOUT L'ENJEU.
     *
     * `lastCountRef` partait de 0 et `records` arrive peuplé dès le montage :
     * `records.length > 0` suffisait, si bien que CHARGER l'application
     * proposait d'annuler un enregistrement qu'on n'avait pas fait — et
     * « Annuler » supprime une vraie contraction, la dernière. Sur une
     * application de suivi de travail, ouverte et rouverte à une main entre
     * deux contractions, c'est une perte à un clic de distance.
     *
     * Second effet, celui qui se voit : `Banners` ne rend qu'UN bandeau, et
     * l'annulation passe avant le rappel de sauvegarde. Trente secondes après
     * chaque chargement, le rappel « Pensez à exporter une sauvegarde » était
     * donc invisible — le bandeau qui devait mener au bouton d'export ne
     * s'affichait pratiquement jamais.
     *
     * On amorce donc le compteur sur ce qui est déjà là : le bandeau ne
     * répond plus qu'à un ajout survenu SOUS LES YEUX de l'utilisatrice.
     */
    if (!amorceRef.current) {
      amorceRef.current = true;
      lastCountRef.current = records.length;
      const dernier = records[records.length - 1];
      if (dernier) lastRecordIdRef.current = dernier.id;
      return;
    }

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
    setExportNudgeDismissedAt(Date.now());
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

  /*
   * Export nudge (priorité basse).
   *
   * IL POINTE MAINTENANT VERS UN BOUTON QUI EXISTE. Ce bandeau disait
   * « Pensez à exporter une sauvegarde (Partager / Exporter) » depuis des
   * mois, et il n'y avait AUCUN code d'export dans l'application : il envoyait
   * chercher un bouton introuvable, tous les sept jours, à quelqu'un qui a
   * autre chose à faire. Le lien mène désormais droit à la section
   * « Sauvegarde » des réglages.
   */
  if (hasValidRecords && showExportNudge) {
    return (
      <div className="app-banner app-banner--muted" id="banner-export-nudge">
        <span className="app-banner-text">
          {t(language, 'banner.exportNudge')}
        </span>
        <Link
          to={`${getRoutePath('settings', language)}#${BACKUP_SECTION_ID}`}
          className="btn btn-secondary btn-small"
          id="link-export-nudge"
          data-testid="export-nudge-link"
        >
          {t(language, 'banner.exportNow')}
        </Link>
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
