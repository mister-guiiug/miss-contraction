import { Link } from 'react-router-dom';
/**
 * Vue Table - Historique des contractions avec édition
 */

import { useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { loadRecords } from '../../storage';
import { ViewLayout } from '../components/layout/ViewLayout';
import { t } from '../../i18n';

const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatContractionsPerHour(meanIntervalMs: number): string {
  if (meanIntervalMs <= 0 || !Number.isFinite(meanIntervalMs)) return '—';
  const n = 3600000 / meanIntervalMs;
  if (!Number.isFinite(n) || n <= 0) return '—';
  const dec = n >= 12 ? 0 : 1;
  const s = n.toFixed(dec).replace('.', ',');
  return `≈ ${s} / h`;
}

export function TableView() {
  const { records, setRecords, settings } = useAppStore();
  const language = settings.language;

  // Recharger les records depuis localStorage au montage
  // pour synchroniser avec les ajouts faits par le code vanilla
  useEffect(() => {
    const freshRecords = loadRecords();
    setRecords(freshRecords);
  }, [setRecords]);

  // Filtrer et trier les records valides
  const validRecords = useMemo(() => {
    return [...records]
      .filter(r => r.end > r.start)
      .sort((a, b) => a.start - b.start);
  }, [records]);

  // Calculer les intervalles et fréquences pour chaque ligne
  const tableData = useMemo(() => {
    return validRecords.map((record, index) => {
      const intervalMs =
        index > 0 ? record.start - validRecords[index - 1].start : null;
      const intervalStr = intervalMs != null ? formatDuration(intervalMs) : '—';
      const freqStr =
        intervalMs != null && intervalMs > 0
          ? formatContractionsPerHour(intervalMs)
          : '—';

      return {
        ...record,
        index: index + 1,
        intervalStr,
        freqStr,
        durationStr: formatDuration(record.end - record.start),
      };
    });
  }, [validRecords]);

  return (
    <ViewLayout
      className="table-page"
      dataTestId="table-view"
      title={t(language, 'table.title')}
      lead={t(language, 'table.lead')}
    >
      <section
        className="card"
        aria-labelledby="table-heading"
        data-testid="table-section"
      >
        <h2 id="table-heading" className="section-title">
          {t(language, 'table.sectionTitle')}
        </h2>

        {validRecords.length === 0 ? (
          <p
            className="empty"
            id="history-table-empty"
            data-testid="table-empty"
          >
            {t(language, 'table.empty')}
          </p>
        ) : (
          <div
            className="history-table-wrap"
            role="region"
            aria-label={t(language, 'table.scrollAria')}
            tabIndex={0}
            data-testid="table-wrapper"
          >
            <table className="history-table" data-testid="contractions-table">
              <thead>
                <tr>
                  <th scope="col">{t(language, 'table.col.num')}</th>
                  <th scope="col">{t(language, 'table.col.start')}</th>
                  <th scope="col">{t(language, 'table.col.duration')}</th>
                  <th scope="col">{t(language, 'table.col.interval')}</th>
                  <th scope="col">{t(language, 'table.col.frequency')}</th>
                  <th scope="col">{t(language, 'table.col.note')}</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map(row => (
                  <tr key={row.id} data-testid={`table-row-${row.id}`}>
                    <th scope="row">{row.index}</th>
                    <td data-testid="table-cell-date">
                      {dateTimeFmt.format(row.start)}
                    </td>
                    <td data-testid="table-cell-duration">{row.durationStr}</td>
                    <td data-testid="table-cell-interval">{row.intervalStr}</td>
                    <td data-testid="table-cell-frequency">{row.freqStr}</td>
                    <td
                      className="history-table-note"
                      data-testid="table-cell-note"
                    >
                      {row.note?.trim() || '—'}
                      {row.intensity && ` [Int. ${row.intensity}]`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="table-footnote">{t(language, 'table.footnote')}</p>
      </section>

      <p className="settings-back-wrap mobile-home-only">
        <Link
          to="/"
          className="btn btn-secondary settings-back-link"
          data-testid="table-back-link"
        >
          {t(language, 'table.backHome')}
        </Link>
      </p>
    </ViewLayout>
  );
}
