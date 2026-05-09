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
import { t } from '../../i18n';

export function HomeView() {
  const { records, settings } = useAppStore();
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const language = settings.language;

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
      title={t(language, 'home.title')}
      lead={t(language, 'home.lead')}
      footer={<AppFooter />}
    >
      <details className="home-intro-details" data-testid="home-intro-details">
        <summary className="home-intro-summary">
          <span>{t(language, 'home.aboutSummary')}</span>
          <span className="home-intro-chevron" aria-hidden="true">
            ›
          </span>
        </summary>
        <p className="subtitle home-intro">{t(language, 'home.aboutText')}</p>
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
            <span>
              {t(language, 'home.note')} : {selectedNote}
            </span>
            <button
              className="btn-clear-note"
              onClick={() => setSelectedNote(null)}
              aria-label={t(language, 'home.clearNote')}
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
