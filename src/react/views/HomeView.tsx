import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TimerSectionWithIntensity } from '../components/home/TimerSectionWithIntensity';
import { StatsSection } from '../components/home/StatsSection';
import { HistoryList } from '../components/home/HistoryList';
import { Banners } from '../components/home/Banners';
import { EmptyState } from '../components/home/EmptyState';
import { TimelineCompact } from '../components/home/TimelineCompact';
import { ThresholdBadge } from '../components/home/ThresholdBadge';
import { QuickNotes } from '../components/home/QuickNotes';

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
    document.documentElement.classList.toggle('mc-large-mode', settings.largeMode);
  }, [settings.largeMode]);

  const handleNoteSelect = (note: string) => {
    setSelectedNote(note);
    // Ici vous pourriez ajouter la logique pour associer la note à la dernière contraction
    // ou l'ajouter à un état temporaire avant la prochaine contraction
  };

  const hasContractions = records.length > 0;

  return (
    <div id="view-home" className="view">
        <details className="home-intro-details">
          <summary className="home-intro-summary">
            <span>À propos de l'application</span>
            <span className="home-intro-chevron" aria-hidden="true">›</span>
          </summary>
          <p className="subtitle home-intro">
            Suivez la fréquence des contractions et recevez une alerte selon les seuils définis dans les
            paramètres (à valider avec votre sage-femme).
          </p>
        </details>

        <div className="app-banners" id="app-banners">
          <Banners />
        </div>

        <TimerSectionWithIntensity />

        <ThresholdBadge />

        {!hasContractions && <EmptyState />}

        {hasContractions && (
          <>
            <TimelineCompact />
            <StatsSection />

            {/* Section Quick Notes */}
            <div className="card">
              <h3 className="section-title">Notes rapides</h3>
              <p className="settings-intro" style={{ marginBottom: '0.5rem' }}>
                Ajoutez une note à la contraction en cours ou à venir
              </p>
              <QuickNotes onNoteSelect={handleNoteSelect} />
              {selectedNote && (
                <p className="hint" style={{ marginTop: '0.5rem', color: 'var(--primary)' }}>
                  Note sélectionnée : {selectedNote}
                </p>
              )}
            </div>

            <HistoryList />
          </>
        )}

        <footer className="footer">
          <p>Cet outil ne remplace pas un avis médical. Appelez la maternité ou le 15 en cas de doute.</p>
          <p>
            <a
              className="footer-link"
              href="https://github.com/mister-guiiug/miss-contraction"
              target="_blank"
              rel="noopener noreferrer"
            >
              Code source sur GitHub
            </a>
            {' '}·{' '}
            <a
              className="footer-link"
              href="https://buymeacoffee.com/mister.guiiug"
              target="_blank"
              rel="noopener noreferrer"
            >
              ☕ Buy me a coffee
            </a>
          </p>
        </footer>
    </div>
  );
}
