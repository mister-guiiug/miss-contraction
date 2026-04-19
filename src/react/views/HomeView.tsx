import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { TimerSection } from '../components/home/TimerSection';
import { StatsSection } from '../components/home/StatsSection';
import { HistoryList } from '../components/home/HistoryList';
import { Banners } from '../components/home/Banners';

export function HomeView() {
  const { records, setRecords, settings } = useAppStore();

  // Synchroniser avec localStorage (modifications vanilla)
  useEffect(() => {
    const freshRecords = [...records]; // Already loaded from storage in store
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

  return (
    <div id="view-home" className="view">
      <p className="subtitle home-intro">
        Suivez la fréquence des contractions et recevez une alerte selon les seuils définis dans les paramètres
        (à valider avec votre sage-femme).
      </p>

      <div className="app-banners" id="app-banners">
        <Banners />
      </div>

      <TimerSection />
      <StatsSection />
      <HistoryList />

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
