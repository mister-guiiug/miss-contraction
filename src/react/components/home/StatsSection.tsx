import { useAppStore } from '../../store/useAppStore';
import { useStats } from '../../hooks/useStats';
import { formatDuration } from '../../../utils/formatDuration';
import type { ContractionRecord } from '../../../storage';
import { getIntensityInfo } from '../../../utils/intensity';

const THRESHOLD_ICONS: Record<string, string> = {
  match: '🏥',
  approaching: '🎯',
  calm: '😌',
  empty: '📊',
};

const THRESHOLD_LABELS: Record<string, string> = {
  match: "Les dernières contractions correspondent à vos seuils d'alerte.",
  approaching:
    'Rythme soutenu — restez attentive aux consignes de votre sage-femme.',
  calm: "En dehors du schéma d'alerte configuré (pour l'instant).",
  empty: 'Pas encore assez de données pour comparer aux seuils.',
};

export function StatsSection() {
  const { records, settings } = useAppStore();
  const { data, windowLabel, isEmpty } = useStats(records, settings);

  const handleShare = async () => {
    const shareText = `Miss Contraction Summary:
- Quantité: ${data.qtyPerHour}
- Durée moyenne: ${data.avgDuration}
- Fréquence: ${data.avgFrequency}
Status: ${data.humanSummary}
${data.thresholdKind === 'match' ? '⚠️ SEUIL ATTEINT !' : ''}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Résumé Miss Contraction',
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Résumé copié dans le presse-papiers !');
      } catch (err) {
        console.error('Copy failed', err);
      }
    }
  };

  return (
    <section
      className="card"
      aria-labelledby="summary-heading"
      data-testid="stats-section"
    >
      <div className="section-head">
        <h2 id="summary-heading" className="section-title">
          Indicateurs récents
        </h2>
        <button
          type="button"
          className="btn-share"
          onClick={handleShare}
          aria-label="Partager le résumé"
          title="Partager le résumé"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      </div>
      <div
        className="stats-enhanced"
        role="group"
        aria-label="Synthèse des contractions"
        data-testid="stats-cards"
      >
        <div className="stat-card" data-testid="stat-card-quantity">
          <span className="stat-card-icon" aria-hidden="true" />
          <span
            className="stat-card-value"
            aria-live="polite"
            data-testid="stat-value-qty"
          >
            {data.qtyPerHour}
          </span>
          <span className="stat-card-label">Quantité / h</span>
        </div>
        <div className="stat-card" data-testid="stat-card-duration">
          <span className="stat-card-icon" aria-hidden="true" />
          <span
            className="stat-card-value"
            aria-live="polite"
            data-testid="stat-value-duration"
          >
            {data.avgDuration}
          </span>
          <span className="stat-card-label">Durée moyenne</span>
        </div>
        <div className="stat-card" data-testid="stat-card-frequency">
          <span className="stat-card-icon" aria-hidden="true" />
          <span
            className="stat-card-value"
            aria-live="polite"
            data-testid="stat-value-frequency"
          >
            {data.avgFrequency}
          </span>
          <span className="stat-card-label">Fréquence moyenne</span>
        </div>
      </div>
      <div className="stats-human-summary" data-testid="stats-human-summary">
        <p className="human-summary-text">{data.humanSummary}</p>
      </div>

      <p
        className="stats-window-label"
        id="stats-window-label"
        data-testid="stats-window-label"
      >
        {windowLabel}
      </p>
      <p
        className={`threshold-badge threshold-badge-enhanced threshold-badge-${data.thresholdKind}`}
        id="threshold-badge"
        data-state={data.thresholdKind}
        data-testid="stats-threshold-badge"
      >
        <span className="badge-icon" aria-hidden="true">
          {THRESHOLD_ICONS[data.thresholdKind] ?? ''}
        </span>
        <span data-testid="threshold-message">
          {THRESHOLD_LABELS[data.thresholdKind] ?? ''}
        </span>
      </p>
      {!isEmpty && (
        <dl
          className="summary summary-extra"
          id="summary-extra"
          data-testid="stats-details"
        >
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

      <div
        className="section-divider"
        role="separator"
        aria-orientation="horizontal"
      />

      <IntervalChart
        intervals={data.intervals}
        recordsForChart={data.recordsForChart}
      />
    </section>
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

  return (
    <div className="interval-list" data-testid="interval-chart">
      <h3 className="chart-title">
        Intervalles entre débuts (derniers enregistrements)
      </h3>
      <ul className="interval-items" role="list" data-testid="interval-items">
        {intervals.map((ms, i) => {
          const record = recordsForChart[i + 1];
          const intensity = record?.intensity;
          const date = record ? new Date(record.start) : null;
          const timeLabel = date
            ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
            : '—';

          return (
            <li
              key={i}
              className="interval-item"
              data-testid={`interval-item-${i}`}
            >
              <span className="interval-time">{timeLabel}</span>
              <span className="interval-sep">›</span>
              <span
                className="interval-value"
                data-testid={`interval-value-${i}`}
              >
                {formatDuration(ms)}
              </span>
              {intensity && (
                <span
                  className={`interval-intensity interval-intensity--${intensity}`}
                  data-testid={`interval-intensity-${i}`}
                  style={{
                    backgroundColor: getIntensityInfo(intensity).color,
                    color: getIntensityInfo(intensity).textColor,
                  }}
                >
                  {getIntensityInfo(intensity).emoji}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
