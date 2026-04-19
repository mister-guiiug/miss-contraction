/**
 * Vue Midwife - Résumé pour la sage-femme avec export
 */

import { useEffect, useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { findFirstThresholdMatchEndMs } from '../../statsHelpers';
import { loadRecords } from '../../storage';
import type { ContractionRecord } from '../../storage';

function meanStartIntervalMs(done: ContractionRecord[]): number | null {
  if (done.length < 2) return null;
  let sum = 0;
  for (let i = 1; i < done.length; i++) {
    sum += done[i]!.start - done[i - 1]!.start;
  }
  return sum / (done.length - 1);
}

function meanContractionDurationMs(done: ContractionRecord[]): number | null {
  if (done.length === 0) return null;
  let sum = 0;
  for (const r of done) {
    sum += r.end - r.start;
  }
  return sum / done.length;
}

type MidwifeMode = '6' | '10' | '12' | '20' | 'all';

const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const dateTimeFmtLong = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'full',
  timeStyle: 'short',
});

function formatStatsClock(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDuration(ms: number): string {
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseMidwifeMode(val: string): MidwifeMode {
  if (val === '6' || val === '10' || val === '12' || val === '20' || val === 'all')
    return val;
  return '12';
}

function sliceForMidwife(records: ContractionRecord[], mode: MidwifeMode): ContractionRecord[] {
  if (mode === 'all' || records.length === 0) return records;
  const n = Number(mode);
  if (!Number.isFinite(n) || n < 1) return records;
  return records.slice(-Math.min(n, records.length));
}

export function MidwifeView() {
  const { records, settings, setRecords } = useAppStore();
  const [mode, setMode] = useState<MidwifeMode>('12');
  const [copyFeedback, setCopyFeedback] = useState('');

  useEffect(() => {
    document.title = 'Résumé sage-femme - Miss Contraction';
  }, []);

  // Recharger les records depuis localStorage au montage
  // pour synchroniser avec les ajouts faits par le code vanilla
  useEffect(() => {
    const freshRecords = loadRecords();
    setRecords(freshRecords);
  }, [setRecords]);

  // Filtrer et trier les records valides
  const validRecords = useMemo(() => {
    return [...records]
      .filter((r) => r.end > r.start)
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

  // Construire le texte pour copie
  const plainText = useMemo(() => {
    const lines: string[] = [];
    const headerFmt = new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    lines.push('Miss Contraction — Résumé pour la sage-femme');
    lines.push(`Généré le ${headerFmt.format(new Date())}`);
    lines.push('');
    lines.push('Seuils configurés dans l\'application :');
    lines.push(
      `— ${settings.consecutiveCount} contractions consécutives, écart entre débuts ≤ ${settings.maxIntervalMin} min, durée ≥ ${settings.minDurationSec} s chacune.`
    );
    lines.push('');
    if (stats.firstEnd != null) {
      lines.push(
        `Première fois où ces critères ont été remplis (sur tout l\'historique) : ${dateTimeFmtLong.format(stats.firstEnd)}.`
      );
    } else {
      lines.push(
        'Aucun groupe de contractions consécutives n\'a encore rempli ces critères dans l\'historique enregistré.'
      );
    }
    lines.push('');
    const modeLabel =
      mode === 'all' ? 'tout l\'historique' : `les ${mode} dernières contractions`;
    lines.push(
      `Période du tableau et des moyennes : ${modeLabel} (${selectedRecords.length} contraction(s)).`
    );
    lines.push('');
    if (selectedRecords.length === 0) {
      lines.push('Aucune contraction dans cette sélection.');
      lines.push('');
      lines.push('—');
      lines.push('Données indicatives — ne remplacent pas un avis médical.');
      return lines.join('\n');
    }
    lines.push('Moyennes sur cette sélection :');
    lines.push(
      `— Quantité estimée : ≈ ${stats.qtyHour} contraction(s) / h (si le rythme restait constant).`
    );
    lines.push(
      `— Durée moyenne : ${stats.meanDur != null ? formatStatsClock(stats.meanDur) : '—'} (mm:ss).`
    );
    lines.push(
      `— Intervalle moyen entre débuts : ${stats.meanInterval != null ? formatStatsClock(stats.meanInterval) : '—'} (mm:ss).`
    );
    lines.push('');
    lines.push('Détail (ordre chronologique) :');
    for (let i = 0; i < selectedRecords.length; i++) {
      const r = selectedRecords[i]!;
      const intervalMs = i > 0 ? r.start - selectedRecords[i - 1]!.start : null;
      const intervalStr = intervalMs != null ? formatDuration(intervalMs) : '—';
      const note = r.note?.trim();
      const intensity = r.intensity ? ` — intensité : ${r.intensity}` : '';
      lines.push(
        `${i + 1}. ${dateTimeFmt.format(r.start)} — durée ${formatDuration(r.end - r.start)} — écart depuis précédente : ${intervalStr}${intensity}${note ? ` — note : ${note}` : ''}`
      );
    }
    lines.push('');
    lines.push('—');
    lines.push('Données indicatives — ne remplacent pas un avis médical.');
    return lines.join('\n');
  }, [mode, selectedRecords, stats, settings]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopyFeedback('Texte copié dans le presse-papiers.');
      setTimeout(() => setCopyFeedback(''), 3500);
    } catch {
      setCopyFeedback('Copie impossible — utilisez « Imprimer ou PDF » ou copiez le texte affiché.');
      setTimeout(() => setCopyFeedback(''), 4500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const modeLabel = mode === 'all' ? `Tout l'historique` : `Les ${mode} dernières contractions`;

  return (
    <div className="midwife-page">
      <p className="subtitle midwife-page-lead no-print">
        Synthèse courte des <strong>dernières contractions</strong>, des{' '}
        <strong>moyennes</strong> sur la période choisie et, si elle a eu lieu,
        l'<strong>heure à laquelle les seuils d'alerte ont été atteints pour la
        première fois</strong> dans tout l'historique. À imprimer ou enregistrer
        en PDF depuis le navigateur.
      </p>

      <section className="card midwife-card">
        <h2 className="section-title no-print">Contenu du résumé</h2>

        <label className="field field--wide midwife-field no-print">
          <span>Contractions listées (ordre chronologique)</span>
          <select
            value={mode}
            onChange={(e) => setMode(parseMidwifeMode(e.target.value))}
            className="midwife-select"
            aria-describedby="midwife-count-hint"
          >
            <option value="6">6 dernières</option>
            <option value="10">10 dernières</option>
            <option value="12">12 dernières</option>
            <option value="20">20 dernières</option>
            <option value="all">Tout l'historique</option>
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
          dangerouslySetInnerHTML={{ __html: `
            <div class="midwife-doc">
              <p class="midwife-doc-title">Miss Contraction — Résumé pour la sage-femme</p>
              <p class="midwife-doc-meta">Généré le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())}</p>
              <section class="midwife-doc-section">
                <h3 class="midwife-doc-h">Seuils (réglages actuels)</h3>
                <p>${settings.consecutiveCount} contractions consécutives, écart entre débuts ≤ ${settings.maxIntervalMin} min, durée ≥ ${settings.minDurationSec} s chacune.</p>
              </section>
              <section class="midwife-doc-section">
                <h3 class="midwife-doc-h">Premier seuil atteint (tout l'historique)</h3>
                <p>${stats.firstEnd != null
                  ? dateTimeFmtLong.format(stats.firstEnd)
                  : 'Aucun groupe enregistré ne remplit encore ces critères.'}</p>
                <p class="midwife-doc-note">Instant retenu : fin de la dernière contraction du premier groupe qui satisfait simultanément l'intervalle et la durée configurés.</p>
              </section>
              ${selectedRecords.length === 0 ? `
                <section class="midwife-doc-section">
                  <h3 class="midwife-doc-h">${modeLabel}</h3>
                  <p class="midwife-empty">Aucune contraction dans cette sélection.</p>
                </section>
              ` : `
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
                        ${selectedRecords.map((r, i) => {
                          const intervalMs = i > 0 ? r.start - selectedRecords[i - 1]!.start : null;
                          const intervalStr = intervalMs != null ? formatDuration(intervalMs) : '—';
                          const note = r.note?.trim();
                          const intensity = r.intensity ? `[Int. ${r.intensity}] ` : '';
                          return `<tr>
                            <td>${i + 1}</td>
                            <td>${dateTimeFmt.format(r.start)}</td>
                            <td>${formatDuration(r.end - r.start)}</td>
                            <td>${intervalStr}</td>
                            <td>${intensity}${note || '—'}</td>
                          </tr>`;
                        }).join('')}
                      </tbody>
                    </table>
                  </div>
                </section>
              `}
              <p class="midwife-doc-disclaimer">Données indicatives — ne remplacent pas un avis médical.</p>
            </div>
          `}}
        />

        {copyFeedback && (
          <p className="midwife-copy-feedback no-print" role="status" aria-live="polite">
            {copyFeedback}
          </p>
        )}

        <div className="midwife-actions no-print" role="group" aria-label="Copier ou imprimer le résumé">
          <button type="button" className="btn btn-secondary" onClick={handleCopy}>
            Copier le texte
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            Imprimer ou PDF
          </button>
        </div>

        <p className="midwife-print-hint no-print">
          Dans la boîte d'impression, choisissez <strong>Enregistrer au format PDF</strong> si
          vous voulez un fichier.
        </p>
      </section>

      <p className="settings-back-wrap no-print">
        <a href="#/historique" className="btn btn-ghost settings-back-link">
          Tableau détaillé
        </a>
        <a href="#/" className="btn btn-secondary settings-back-link">
          Accueil
        </a>
      </p>
    </div>
  );
}
