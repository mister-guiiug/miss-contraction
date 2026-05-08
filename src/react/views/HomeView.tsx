import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TimerSectionWithIntensity } from '../components/home/TimerSectionWithIntensity';
import { StatsSection } from '../components/home/StatsSection';
import { HistoryList } from '../components/home/HistoryList';
import { Banners } from '../components/home/Banners';
import { EmptyState } from '../components/home/EmptyState';
import { TimelineCompact } from '../components/home/TimelineCompact';
import { ThresholdBadge } from '../components/home/ThresholdBadge';
import { AppFooter } from '../components/layout/AppFooter';
import { ViewLayout } from '../components/layout/ViewLayout';
import { vibrate } from '../hooks/useWakeLock';

export function HomeView() {
  const { records, setRecords, settings } = useAppStore();
  const [selectedNote, setSelectedNote] = useState<string | null>(null);

  // Synchroniser avec localStorage (modifications vanilla)
  useEffect(() => {
    const freshRecords = [...records];
    setRecords(freshRecords);
  }, []);

  // Mettre à jour le titre de la page
  useEffect(() => {
    document.title = 'Miss Contraction';
  }, []);

  // Mettre à jour les classes globales
  useEffect(() => {
    document.documentElement.classList.toggle(
      'mc-large-mode',
      settings.largeMode
    );
  }, [settings.largeMode]);

  const handleNoteSelect = useCallback(
    (note: string) => {
      setSelectedNote(note);
      if (settings.vibrationEnabled) {
        vibrate(20, true);
      }
    },
    [settings.vibrationEnabled]
  );

  const hasContractions = records.length > 0;

  return (
    <ViewLayout
      id="view-home"
      dataTestId="view-home"
      className="view--home"
      title="Suivi des contractions"
      lead="Enregistrez chaque contraction, surveillez le rythme et gardez vos reperes essentiels a portee de main."
      footer={<AppFooter />}
    >
      <details className="home-intro-details" data-testid="home-intro-details">
        <summary className="home-intro-summary">
          <span>À propos de l'application</span>
          <span className="home-intro-chevron" aria-hidden="true">
            ›
          </span>
        </summary>
        <p className="subtitle home-intro">
          Suivez la fréquence des contractions et recevez une alerte selon les
          seuils définis dans les paramètres (à valider avec votre sage-femme).
        </p>
      </details>

      <div className="app-banners" id="app-banners" data-testid="app-banners">
        <Banners />
      </div>

      <div data-testid="timer-section">
        <TimerSectionWithIntensity
          onNoteSelect={handleNoteSelect}
          selectedNote={selectedNote}
          onClearNote={() => setSelectedNote(null)}
        />
        {selectedNote && (
          <div
            className="selected-note-feedback"
            data-testid="selected-note-display"
          >
            <span>Note : {selectedNote}</span>
            <button
              className="btn-clear-note"
              onClick={() => setSelectedNote(null)}
              aria-label="Effacer la note"
            >
              ×
            </button>
          </div>
        )}
      </div>

      <ThresholdBadge />

      {!hasContractions && <EmptyState />}

      {hasContractions && (
        <>
          <TimelineCompact />
          <StatsSection />
          <HistoryList />
        </>
      )}
    </ViewLayout>
  );
}
