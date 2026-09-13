import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { PwaInstallPrompt } from '@mister-guiiug/dev-pwa-config/react/pwa-install-prompt';
import { TimerSectionWithIntensity } from '../components/home/TimerSectionWithIntensity';
import { StatsSection } from '../components/home/StatsSection';
import { Banners } from '../components/home/Banners';
import { EmptyState } from '../components/home/EmptyState';
import { TimelineCompact } from '../components/home/TimelineCompact';
import { ThresholdBadge } from '../components/home/ThresholdBadge';
import { AppFooter } from '../components/layout/AppFooter';
import { ViewLayout } from '../components/layout/ViewLayout';
import { vibrate } from '@mister-guiiug/dev-pwa-config/haptics';
import { t } from '../../i18n';

export function HomeView() {
  const { records, settings } = useAppStore();
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const language = settings.language;

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
      // Simple sélection : la pichenette d'affordance du socle suffit.
      if (settings.vibrationEnabled) {
        vibrate('tap');
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
        </>
      )}

      {/* SUR L'ACCUEIL, ET PAS DANS LA COQUILLE : une invite ne doit pas
          paraître par-dessus un chronomètre de contraction en cours. Ne rend
          rien tant qu'une installation n'est pas possible, ni une fois
          l'application installée — et sur iOS, où l'événement natif n'existe
          pas, donne la marche à suivre. Cadence du socle : au premier
          lancement, puis une fois par mois, trois fois.

          L'habillage est dans `enhanced-ui.css` : l'app n'importe pas
          `components.css`, le composant arrive donc nu, comme l'état vide. */}
      <PwaInstallPrompt />
    </ViewLayout>
  );
}
