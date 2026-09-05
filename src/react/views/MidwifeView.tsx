import { Link } from 'react-router-dom';
/**
 * Vue Midwife - Résumé pour la sage-femme avec export
 */

import { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { downloadMidwifePdf } from '../../midwifePdf';
import {
  buildMidwifeSummaryText,
  formatDuration,
  meanContractionDurationMs,
  meanStartIntervalMs,
  midwifeDateTimeFmt as dateTimeFmt,
  midwifeDateTimeFmtLong as dateTimeFmtLong,
  type MidwifeMode,
} from '../../midwifeSummary';
import { findFirstThresholdMatchEndMs } from '../../statsHelpers';
import { loadRecords } from '../../storage';
import type { ContractionRecord } from '../../storage';
import { formatStatsClock } from '../../utils/formatStats';
import { ViewLayout } from '../components/layout/ViewLayout';
import { t } from '../../i18n';
import { getDefaultLocale } from '@mister-guiiug/dev-pwa-config/format';

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

export function MidwifeView() {
  const { records, settings, setRecords } = useAppStore();
  const language = settings.language;
  const [mode, setMode] = useState<MidwifeMode>('12');
  const [copyFeedback, setCopyFeedback] = useState('');

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
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        buildMidwifeSummaryText(summaryInput())
      );
      setCopyFeedback(
        language === 'fr'
          ? 'Texte copie dans le presse-papiers.'
          : 'Text copied to clipboard.'
      );
      setTimeout(() => setCopyFeedback(''), 3500);
    } catch {
      setCopyFeedback(
        language === 'fr'
          ? 'Copie impossible - utilisez Imprimer ou PDF ou copiez le texte affiche.'
          : 'Copy failed - use Print or PDF, or copy the displayed text manually.'
      );
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
      ? language === 'fr'
        ? "Tout l'historique"
        : 'Full history'
      : language === 'fr'
        ? `Les ${mode} dernieres contractions`
        : `Last ${mode} contractions`;

  return (
    <ViewLayout
      className="midwife-page"
      dataTestId="midwife-view"
      title={t(language, 'route.midwife')}
      lead={
        <span className="no-print">
          {language === 'fr' ? 'Synthese courte des ' : 'Short summary of '}
          <strong>
            {language === 'fr'
              ? 'dernieres contractions'
              : 'latest contractions'}
          </strong>
          {language === 'fr' ? ', des ' : ', with '}
          <strong>{language === 'fr' ? 'moyennes' : 'averages'}</strong>
          {language === 'fr'
            ? ' sur la periode choisie et, si elle existe, de l heure du premier seuil atteint.'
            : ' over the selected period and, when available, the first threshold match time.'}
        </span>
      }
    >
      <section className="card midwife-card">
        <h2 className="section-title no-print">
          {language === 'fr' ? 'Contenu du resume' : 'Summary content'}
        </h2>

        <label className="field field--wide midwife-field no-print">
          <span>
            {language === 'fr'
              ? 'Contractions listees (ordre chronologique)'
              : 'Listed contractions (chronological order)'}
          </span>
          <select
            value={mode}
            onChange={e => setMode(parseMidwifeMode(e.target.value))}
            className="midwife-select"
            aria-describedby="midwife-count-hint"
          >
            <option value="6">
              {language === 'fr' ? '6 dernieres' : 'Last 6'}
            </option>
            <option value="10">
              {language === 'fr' ? '10 dernieres' : 'Last 10'}
            </option>
            <option value="12">
              {language === 'fr' ? '12 dernieres' : 'Last 12'}
            </option>
            <option value="20">
              {language === 'fr' ? '20 dernieres' : 'Last 20'}
            </option>
            <option value="all">
              {language === 'fr' ? "Tout l'historique" : 'Full history'}
            </option>
          </select>
        </label>

        <p className="midwife-hint no-print" id="midwife-count-hint">
          Les moyennes (durée, intervalle, quantité / h) sont calculées{' '}
          <strong>uniquement</strong> sur cette sélection. Le « premier seuil
          atteint » utilise <strong>tout</strong> l'historique enregistré.
        </p>

        <div
          className="midwife-print-root"
          aria-live="polite"
          dangerouslySetInnerHTML={{
            __html: `
            <div class="midwife-doc">
              <p class="midwife-doc-title">Miss Contraction — Résumé pour la sage-femme</p>
              <p class="midwife-doc-meta">Généré le ${new Intl.DateTimeFormat(getDefaultLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}</p>
              <section class="midwife-doc-section">
                <h3 class="midwife-doc-h">Seuils (réglages actuels)</h3>
                <p>${settings.consecutiveCount} contractions consécutives, écart entre débuts ≤ ${settings.maxIntervalMin} min, durée ≥ ${settings.minDurationSec} s chacune.</p>
              </section>
              <section class="midwife-doc-section">
                <h3 class="midwife-doc-h">Premier seuil atteint (tout l'historique)</h3>
                <p>${
                  stats.firstEnd != null
                    ? dateTimeFmtLong.format(stats.firstEnd)
                    : 'Aucun groupe enregistré ne remplit encore ces critères.'
                }</p>
                <p class="midwife-doc-note">Instant retenu : fin de la dernière contraction du premier groupe qui satisfait simultanément l'intervalle et la durée configurés.</p>
              </section>
              ${
                selectedRecords.length === 0
                  ? `
                <section class="midwife-doc-section">
                  <h3 class="midwife-doc-h">${modeLabel}</h3>
                  <p class="midwife-empty">Aucune contraction dans cette sélection.</p>
                </section>
              `
                  : `
                <section class="midwife-doc-section">
                  <h3 class="midwife-doc-h">Moyennes — ${modeLabel} (${selectedRecords.length})</h3>
                  <ul class="midwife-doc-stats">
                    <li>Quantité estimée : ≈ ${stats.qtyHour} contraction(s) / h (rythme constant)</li>
                    <li>Durée moyenne : ${stats.meanDur != null ? formatStatsClock(stats.meanDur) : '—'} (mm:ss)</li>
                    <li>Intervalle moyen entre débuts : ${stats.meanInterval != null ? formatStatsClock(stats.meanInterval) : '—'} (mm:ss)</li>
                  </ul>
                </section>
                <section class="midwife-doc-section">
                  <h3 class="midwife-doc-h">Détail (ordre chronologique)</h3>
                  <div class="midwife-table-wrap">
                    <table class="midwife-table">
                      <thead>
                        <tr>
                          <th scope="col">N°</th>
                          <th scope="col">Début</th>
                          <th scope="col">Durée</th>
                          <th scope="col">Écart</th>
                          <th scope="col">Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${selectedRecords
                          .map((r, i) => {
                            const intervalMs =
                              i > 0
                                ? r.start - selectedRecords[i - 1]!.start
                                : null;
                            const intervalStr =
                              intervalMs != null
                                ? formatDuration(intervalMs)
                                : '—';
                            const note = r.note?.trim();
                            const intensity = r.intensity
                              ? `[Int. ${r.intensity}] `
                              : '';
                            return `<tr>
                            <td>${i + 1}</td>
                            <td>${dateTimeFmt.format(r.start)}</td>
                            <td>${formatDuration(r.end - r.start)}</td>
                            <td>${intervalStr}</td>
                            <td>${intensity}${note || '—'}</td>
                          </tr>`;
                          })
                          .join('')}
                      </tbody>
                    </table>
                  </div>
                </section>
              `
              }
              <p class="midwife-doc-disclaimer">Données indicatives — ne remplacent pas un avis médical.</p>
            </div>
          `,
          }}
        />

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
          aria-label={
            language === 'fr'
              ? 'Copier, telecharger ou imprimer le resume'
              : 'Copy, download or print summary'
          }
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCopy}
          >
            {language === 'fr' ? 'Copier le texte' : 'Copy text'}
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
            {language === 'fr' ? 'Imprimer ou PDF' : 'Print or PDF'}
          </button>
        </div>

        <p className="midwife-print-hint no-print">
          Dans la boîte d'impression, choisissez{' '}
          <strong>Enregistrer au format PDF</strong> si vous voulez un fichier.
        </p>
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
          {language === 'fr' ? 'Tableau detaille' : 'Detailed table'}
        </Link>
        <Link to="/" className="btn btn-secondary mobile-home-link">
          {t(language, 'route.home')}
        </Link>
      </div>
    </ViewLayout>
  );
}
