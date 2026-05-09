import { useAppStore } from '../../store/useAppStore';
import { useStats } from '../../hooks/useStats';
import { formatDuration } from '../../../utils/formatDuration';
import type { ContractionRecord } from '../../../storage';
import { t, type AppLanguage } from '../../../i18n';

const THRESHOLD_ICONS: Record<string, string> = {
  match: '🏥',
  approaching: '🎯',
  calm: '😌',
  empty: '📊',
};

const THRESHOLD_KEYS: Record<string, string> = {
  match: 'stats.threshold.match',
  approaching: 'stats.threshold.approaching',
  calm: 'stats.threshold.calm',
  empty: 'stats.threshold.empty',
};

export function StatsSection() {
  const { records, settings } = useAppStore();
  const language = settings.language;
  const { data, windowLabel, isEmpty } = useStats(records, settings);

  return (
    <section
      className="card"
      aria-labelledby="summary-heading"
      data-testid="stats-section"
    >
      <h2 id="summary-heading" className="section-title">
        {t(language, 'stats.title')}
      </h2>
      <div
        className="stats-enhanced"
        role="group"
        aria-label={t(language, 'stats.summaryAria')}
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
          <span className="stat-card-label">{t(language, 'stats.qty')}</span>
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
          <span className="stat-card-label">
            {t(language, 'stats.avgDuration')}
          </span>
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
          <span className="stat-card-label">
            {t(language, 'stats.avgFrequency')}
          </span>
        </div>
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
          {t(
            language,
            THRESHOLD_KEYS[data.thresholdKind] ?? 'stats.threshold.empty'
          )}
        </span>
      </p>
      {!isEmpty && (
        <dl
          className="summary summary-extra"
          id="summary-extra"
          data-testid="stats-details"
        >
          <dt>{t(language, 'stats.lastHour')}</dt>
          <dd>{data.lastHourCount}</dd>
          <dt>{t(language, 'stats.detailEstimation')}</dt>
          <dd>{data.perHourFromMean}</dd>
          <dt>{t(language, 'stats.lastInterval')}</dt>
          <dd>{data.lastInterval}</dd>
          <dt>{t(language, 'stats.lastDuration')}</dt>
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
        language={language}
      />
    </section>
  );
}

function IntervalChart({
  intervals,
  recordsForChart,
  language,
}: {
  intervals: number[];
  recordsForChart: ContractionRecord[];
  language: AppLanguage;
}) {
  if (intervals.length === 0) return null;

  return (
    <div className="interval-list" data-testid="interval-chart">
      <h3 className="chart-title">{t(language, 'stats.intervalsTitle')}</h3>
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
                >
                  {intensity}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
