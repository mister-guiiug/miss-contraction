import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';

interface ChartWithTrendProps {
  thresholdMinutes?: number;
}

/**
 * Graphique des intervalles avec courbe de tendance lissée
 */
export function ChartWithTrend({ thresholdMinutes = 5 }: ChartWithTrendProps) {
  const { records, settings } = useAppStore();

  const { bars, trendPath, thresholdPercent } = useMemo(() => {
    // Filtrer selon la fenêtre de statistiques
    const now = Date.now();
    const windowMs = settings.statsWindowMinutes === 'all'
      ? Infinity
      : settings.statsWindowMinutes * 60 * 1000;

    const filtered = records.filter((r) => now - r.start <= windowMs);

    // Prendre les 10 derniers pour le graphique
    const recent = filtered.slice(-10);

    // Calculer les intervalles (en minutes)
    const intervals: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      const interval = (recent[i].start - recent[i - 1].start) / 1000 / 60;
      intervals.push(interval);
    }

    // Trouver le max pour l'échelle
    const maxInterval = Math.max(...intervals, thresholdMinutes * 1.5);

    // Générer les barres
    const bars = intervals.map((interval, i) => {
      const heightPercent = (interval / maxInterval) * 100;
      const time = new Date(recent[i + 1].start).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      return { interval, heightPercent, time, intensity: recent[i + 1].intensity };
    });

    // Générer le chemin SVG de tendance (courbe de Bézier lissée)
    let trendPath = '';
    if (bars.length >= 2) {
      const width = 100;
      const height = 100;
      const step = width / (bars.length - 1);

      const points = bars.map((bar, i) => ({
        x: i * step,
        y: height - bar.heightPercent,
      }));

      // Créer une courbe de Bézier lissée
      trendPath = `M ${points[0].x} ${points[0].y}`;

      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cp1x = p0.x + step / 3;
        const cp1y = p0.y;
        const cp2x = p1.x - step / 3;
        const cp2y = p1.y;
        trendPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
      }
    }

    // Calculer la position de la ligne de seuil
    const thresholdPercent = (thresholdMinutes / maxInterval) * 100;

    return { bars, trendPath, thresholdPercent };
  }, [records, settings.statsWindowMinutes, thresholdMinutes]);

  const getIntensityClass = (intensity?: number) => {
    if (!intensity) return 'chart-bar--intensity-1';
    return `chart-bar--intensity-${intensity}`;
  };

  if (bars.length === 0) {
    return null;
  }

  return (
    <div className="chart-block">
      <h4 className="chart-title">Intervalles entre contractions</h4>
      <div className="chart-container">
        <div className="chart-wrapper">
          {/* Ligne de seuil */}
          <div
            className="chart-threshold-line"
            style={{ bottom: `${thresholdPercent}%` }}
          >
            <span className="chart-threshold-label">Seuil {thresholdMinutes} min</span>
          </div>

          {/* Courbe de tendance SVG */}
          <svg className="chart-trend-line" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path className="chart-trend-path" d={trendPath} />
            {bars.length > 0 && (
              <circle
                className="chart-trend-dot"
                cx={((bars.length - 1) * 100) / Math.max(bars.length - 1, 1)}
                cy={100 - bars[bars.length - 1].heightPercent}
              />
            )}
          </svg>

          {/* Barres existantes */}
          <div className="chart-bars">
            {bars.map((bar, i) => (
              <div key={i} className="chart-bar-wrap">
                <div className="chart-bar-container">
                  <div
                    className={`chart-bar ${getIntensityClass(bar.intensity)}`}
                    style={{ height: `${Math.max(bar.heightPercent, 4)}%` }}
                  />
                  <div>{Math.round(bar.interval)}m</div>
                  <div className="chart-bar-label">{bar.time}</div>
                  {bar.intensity && (
                    <div className="chart-bar-intensity" style={{ backgroundColor: 'transparent' }}>
                      {bar.intensity}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
