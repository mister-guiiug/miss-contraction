import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';

/**
 * Timeline compacte horizontale pour les 5 dernières contractions
 * avec indicateur de tendance (s'accélère / ralentit)
 */
export function TimelineCompact() {
  const { records } = useAppStore();

  const { lastFive, trend } = useMemo(() => {
    if (records.length === 0) return { lastFive: [], trend: null };

    // Prendre les 5 dernières contractions
    const sorted = [...records].sort((a, b) => b.start - a.start);
    const lastFive = sorted.slice(0, 5).reverse();

    // Calculer la tendance (comparer les 3 derniers intervalles)
    if (lastFive.length >= 3) {
      const intervals: number[] = [];
      for (let i = 1; i < lastFive.length; i++) {
        const interval = (lastFive[i].start - lastFive[i - 1].start) / 1000 / 60;
        intervals.push(interval);
      }

      const avg1 = intervals.slice(0, Math.floor(intervals.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(intervals.length / 2);
      const avg2 = intervals.slice(Math.floor(intervals.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(intervals.length / 2);

      if (avg2 < avg1 * 0.85) {
        return { lastFive, trend: 'faster' as const };
      } else if (avg2 > avg1 * 1.15) {
        return { lastFive, trend: 'slower' as const };
      }
    }

    return { lastFive, trend: 'stable' as const };
  }, [records]);

  if (lastFive.length === 0) return null;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startMs: number, endMs: number) => {
    const seconds = Math.floor((endMs - startMs) / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const getIntensityColor = (intensity?: number) => {
    if (!intensity) return '#80c878';
    const colors = {
      1: '#80c878',
      2: '#a8d678',
      3: '#ffd04b',
      4: '#ff9d4b',
      5: '#ff5e4b',
    };
    return colors[intensity as keyof typeof colors] || '#80c878';
  };

  const trendLabel = {
    faster: 'S\'accélère ↗',
    slower: 'Ralentit ↘',
    stable: 'Stable →',
  };

  const trendClass = {
    faster: 'trend-indicator--faster',
    slower: 'trend-indicator--slower',
    stable: 'trend-indicator--stable',
  };

  return (
    <div className="card">
      <div className="section-head">
        <h3 className="section-title">Dernières contractions</h3>
        {trend && (
          <span className={`trend-indicator ${trendClass[trend]}`}>
            {trendLabel[trend]}
          </span>
        )}
      </div>

      <div className="timeline-compact">
        {lastFive.map((record, index) => (
          <div key={record.id || index} className="timeline-compact-item">
            <div className="timeline-compact-time">{formatTime(record.start)}</div>
            <div className="timeline-compact-duration">{formatDuration(record.start, record.end)}</div>
            {record.intensity && (
              <div
                className="timeline-compact-intensity"
                style={{ backgroundColor: getIntensityColor(record.intensity) }}
              >
                {record.intensity}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
