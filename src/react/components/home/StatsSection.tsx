import { useAppStore } from '../../store/useAppStore';
import { useStats } from '../../hooks/useStats';
import { formatDuration } from '../../../utils/formatDuration';
import type { ContractionRecord } from '../../../storage';

const THRESHOLD_ICONS: Record<string, string> = {
  match: '🏥',
  approaching: '🎯',
  calm: '😌',
  empty: '📊',
};

const THRESHOLD_LABELS: Record<string, string> = {
  match: 'Les dernières contractions correspondent à vos seuils d\'alerte.',
  approaching: 'Rythme soutenu — restez attentive aux consignes de votre sage-femme.',
  calm: 'En dehors du schéma d\'alerte configuré (pour l\'instant).',
  empty: 'Pas encore assez de données pour comparer aux seuils.',
};

export function StatsSection() {
  const { records, settings } = useAppStore();
  const { data, windowLabel, isEmpty } = useStats(records, settings);

  return (
    <>
      <section className="card" aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="section-title">Indicateurs récents</h2>
        <div className="stats-enhanced" role="group" aria-label="Synthèse des contractions">
          <div className="stat-card">
            <span className="stat-card-icon" aria-hidden="true" />
            <span className="stat-card-value" aria-live="polite">
              {data.qtyPerHour}
            </span>
            <span className="stat-card-label">Quantité / h</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-icon" aria-hidden="true" />
            <span className="stat-card-value" aria-live="polite">
              {data.avgDuration}
            </span>
            <span className="stat-card-label">Durée moyenne</span>
          </div>
          <div className="stat-card">
            <span className="stat-card-icon" aria-hidden="true" />
            <span className="stat-card-value" aria-live="polite">
              {data.avgFrequency}
            </span>
            <span className="stat-card-label">Fréquence moyenne</span>
          </div>
        </div>
        <p className="stats-window-label" id="stats-window-label">
          {windowLabel}
        </p>
        <p
          className={`threshold-badge threshold-badge-enhanced threshold-badge-${data.thresholdKind}`}
          id="threshold-badge"
          data-state={data.thresholdKind}
        >
          <span className="badge-icon">
            {THRESHOLD_ICONS[data.thresholdKind] ?? ''}
          </span>
          {THRESHOLD_LABELS[data.thresholdKind] ?? ''}
        </p>
        {!isEmpty && (
          <dl className="summary summary-extra" id="summary-extra">
            <dt>Contractions (dernière heure)</dt>
            <dd>{data.lastHourCount}</dd>
            <dt>Estimation détaillée</dt>
            <dd>{data.perHourFromMean}</dd>
            <dt>Dernier intervalle</dt>
            <dd>{data.lastInterval}</dd>
            <dt>Dernière durée</dt>
            <dd>{data.lastDuration}</dd>
          </dl>
        )}
      </section>

      <IntervalChart intervals={data.intervals} recordsForChart={data.recordsForChart} />
    </>
  );
}

function IntervalChart({
  intervals,
  recordsForChart,
}: {
  intervals: number[];
  recordsForChart: ContractionRecord[];
}) {
  if (intervals.length === 0) return null;

  const max = Math.max(...intervals, 1);

  return (
    <div className="chart-block" id="chart-block">
      <h3 className="chart-title">
        Intervalles entre débuts (derniers enregistrements)
      </h3>
      <div
        className="chart-bars chart-enhanced"
        id="chart-bars"
        role="img"
        aria-label="Barres proportionnelles aux intervalles"
      >
        {intervals.map((ms, i) => {
          const pct = Math.min(100, Math.round((ms / max) * 100));
          const record = recordsForChart[i + 1];
          const intensity = record?.intensity;
          const date = record ? new Date(record.start) : null;
          const timeLabel = date
            ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
            : '—';

          return (
            <div key={i} className="chart-bar-container">
              <div className="chart-bar-label">{timeLabel}</div>
              <div
                className={`chart-bar ${intensity ? `chart-bar--intensity-${intensity}` : ''}`}
                style={{ width: `${pct}%` }}
                title={formatDuration(ms)}
              />
              {intensity && (
                <div className="chart-bar-intensity" title={`Intensité ${intensity}`}>
                  {intensity}
                </div>
              )}
              <div>{formatDuration(ms)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
