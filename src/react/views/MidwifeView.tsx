import { Link } from 'react-router-dom';
/**
 * Vue Midwife - Résumé pour la sage-femme avec export
 */

import { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { downloadMidwifePdf } from '../../midwifePdf';
import {
  buildMidwifeSummaryText,
  meanContractionDurationMs,
  meanStartIntervalMs,
  midwifeDateTimeFmt as dateTimeFmt,
  midwifeDateTimeFmtLong as dateTimeFmtLong,
  type MidwifeMode,
} from '../../midwifeSummary';
import { findFirstThresholdMatchEndMs } from '../../statsHelpers';
import { loadRecords } from '../../storage';
import type { ContractionRecord } from '../../storage';
import { formatDuration } from '../../utils/formatDuration';
import { ViewLayout } from '../components/layout/ViewLayout';
import { interpolate, t } from '../../i18n';
import { getDefaultLocale } from '@mister-guiiug/dev-pwa-config/format';

const MODES: MidwifeMode[] = ['6', '10', '12', '20', 'all'];

const headerFmt = new Intl.DateTimeFormat(getDefaultLocale(), {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function parseMidwifeMode(val: string): MidwifeMode {
  if (
    val === '6' ||
    val === '10' ||
    val === '12' ||
    val === '20' ||
    val === 'all'
  )
    return val;
  return '12';
}

function sliceForMidwife(
  records: ContractionRecord[],
  mode: MidwifeMode
): ContractionRecord[] {
  if (mode === 'all' || records.length === 0) return records;
  const n = Number(mode);
  if (!Number.isFinite(n) || n < 1) return records;
  return records.slice(-Math.min(n, records.length));
}

/**
 * Le document remis à la sage-femme.
 *
 * IL EST ÉCRIT EN JSX, PLUS EN `dangerouslySetInnerHTML`. Le gabarit précédent
 * concaténait les notes libres dans une chaîne HTML sans échappement : une note
 * contenant du balisage s'exécutait à l'affichage. Le rendu React échappe, et
 * la traduction devient possible au passage — la page entière était écrite en
 * français dans le code, sans accents, avec un repli anglais improvisé.
 */
export function MidwifeView() {
  const { records, settings, setRecords } = useAppStore();
  const language = settings.language;
  const [mode, setMode] = useState<MidwifeMode>('12');
  const [copyFeedback, setCopyFeedback] = useState('');

  const tr = (key: string) => t(language, key);
  const trv = (key: string, values: Record<string, string | number>) =>
    interpolate(t(language, key), values);

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

  // Sélectionner les records selon le mode
  const selectedRecords = useMemo(() => {
    return sliceForMidwife(validRecords, mode);
  }, [validRecords, mode]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const meanInterval = meanStartIntervalMs(selectedRecords);
    const meanDur = meanContractionDurationMs(selectedRecords);
    const qtyHour =
      meanInterval != null && meanInterval > 0
        ? String(Math.round(3600000 / meanInterval))
        : '—';
    const firstEnd = findFirstThresholdMatchEndMs(records, settings);
    return { meanInterval, meanDur, qtyHour, firstEnd };
  }, [selectedRecords, records, settings]);

  // Données du résumé (constructeur pur partagé entre copie et PDF)
  const summaryInput = () => ({
    selectedRecords,
    settings,
    mode,
    firstThresholdEndMs: stats.firstEnd,
    generatedAtMs: Date.now(),
    language,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        buildMidwifeSummaryText(summaryInput())
      );
      setCopyFeedback(tr('midwife.copied'));
      setTimeout(() => setCopyFeedback(''), 3500);
    } catch {
      setCopyFeedback(tr('midwife.copyFailed'));
      setTimeout(() => setCopyFeedback(''), 4500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    downloadMidwifePdf(summaryInput());
  };

  const modeLabel =
    mode === 'all'
      ? tr('midwife.allHistory')
      : trv('midwife.modeLastN', { n: mode });

  return (
    <ViewLayout
      className="midwife-page"
      dataTestId="midwife-view"
      title={t(language, 'route.midwife')}
      lead={<span className="no-print">{tr('midwife.lead')}</span>}
    >
      <section className="card midwife-card">
        <h2 className="section-title no-print">{tr('midwife.contentTitle')}</h2>

        <label className="field field--wide midwife-field no-print">
          <span>{tr('midwife.listedLabel')}</span>
          <select
            value={mode}
            onChange={e => setMode(parseMidwifeMode(e.target.value))}
            className="midwife-select"
            aria-describedby="midwife-count-hint"
          >
            {MODES.map(m => (
              <option key={m} value={m}>
                {m === 'all'
                  ? tr('midwife.allHistory')
                  : trv('midwife.lastN', { n: m })}
              </option>
            ))}
          </select>
        </label>

        <p className="midwife-hint no-print" id="midwife-count-hint">
          {tr('midwife.countHint')}
        </p>

        <div className="midwife-print-root" aria-live="polite">
          <div className="midwife-doc">
            <p className="midwife-doc-title">{tr('midwife.docTitle')}</p>
            <p className="midwife-doc-meta">
              {trv('midwife.generatedOn', {
                date: headerFmt.format(new Date()),
              })}
            </p>

            <section className="midwife-doc-section">
              <h3 className="midwife-doc-h">{tr('midwife.thresholdsTitle')}</h3>
              <p>
                {trv('midwife.thresholdsText', {
                  count: settings.consecutiveCount,
                  interval: settings.maxIntervalMin,
                  duration: settings.minDurationSec,
                })}
              </p>
            </section>

            <section className="midwife-doc-section">
              <h3 className="midwife-doc-h">{tr('midwife.firstMatchTitle')}</h3>
              <p>
                {stats.firstEnd != null
                  ? dateTimeFmtLong.format(stats.firstEnd)
                  : tr('midwife.firstMatchNone')}
              </p>
              <p className="midwife-doc-note">{tr('midwife.firstMatchNote')}</p>
            </section>

            {selectedRecords.length === 0 ? (
              <section className="midwife-doc-section">
                <h3 className="midwife-doc-h">{modeLabel}</h3>
                <p className="midwife-empty">{tr('midwife.emptySelection')}</p>
              </section>
            ) : (
              <>
                <section className="midwife-doc-section">
                  <h3 className="midwife-doc-h">
                    {trv('midwife.averagesTitle', {
                      mode: modeLabel,
                      count: selectedRecords.length,
                    })}
                  </h3>
                  <ul className="midwife-doc-stats">
                    <li>{trv('midwife.statQty', { value: stats.qtyHour })}</li>
                    <li>
                      {trv('midwife.statDuration', {
                        value:
                          stats.meanDur != null
                            ? formatDuration(stats.meanDur)
                            : '—',
                      })}
                    </li>
                    <li>
                      {trv('midwife.statInterval', {
                        value:
                          stats.meanInterval != null
                            ? formatDuration(stats.meanInterval)
                            : '—',
                      })}
                    </li>
                  </ul>
                </section>

                <section className="midwife-doc-section">
                  <h3 className="midwife-doc-h">{tr('midwife.detailTitle')}</h3>
                  <div className="midwife-table-wrap">
                    <table className="midwife-table">
                      <thead>
                        <tr>
                          <th scope="col">{tr('midwife.col.num')}</th>
                          <th scope="col">{tr('midwife.col.start')}</th>
                          <th scope="col">{tr('midwife.col.duration')}</th>
                          <th scope="col">{tr('midwife.col.interval')}</th>
                          <th scope="col">{tr('midwife.col.note')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecords.map((r, i) => {
                          const prev = selectedRecords[i - 1];
                          const intervalMs =
                            i > 0 && prev ? r.start - prev.start : null;
                          const note = r.note?.trim();
                          return (
                            <tr key={r.id}>
                              <td>{i + 1}</td>
                              <td>{dateTimeFmt.format(r.start)}</td>
                              <td>{formatDuration(r.end - r.start)}</td>
                              <td>
                                {intervalMs != null
                                  ? formatDuration(intervalMs)
                                  : '—'}
                              </td>
                              <td>
                                {r.intensity
                                  ? `[${tr('midwife.intensityShort')} ${r.intensity}] `
                                  : ''}
                                {note || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}

            <p className="midwife-doc-disclaimer">{tr('midwife.disclaimer')}</p>
          </div>
        </div>

        {copyFeedback && (
          <p
            className="midwife-copy-feedback no-print"
            role="status"
            aria-live="polite"
          >
            {copyFeedback}
          </p>
        )}

        <div
          className="midwife-actions no-print"
          role="group"
          aria-label={tr('midwife.actionsAria')}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCopy}
          >
            {tr('midwife.copyText')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDownloadPdf}
          >
            {t(language, 'midwife.downloadPdf')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrint}
          >
            {tr('midwife.print')}
          </button>
        </div>

        <p className="midwife-print-hint no-print">{tr('midwife.printHint')}</p>
      </section>

      <div className="midwife-nav-footer no-print">
        <Link to="/historique" className="midwife-table-link">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          {tr('midwife.detailedTable')}
        </Link>
        <Link to="/" className="btn btn-secondary mobile-home-link">
          {t(language, 'route.home')}
        </Link>
      </div>
    </ViewLayout>
  );
}
