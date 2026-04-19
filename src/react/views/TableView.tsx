/**
 * Vue Table - Historique des contractions avec édition
 */

import { useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';

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
  const { records } = useAppStore();

  useEffect(() => {
    document.title = 'Tableau des contractions - Miss Contraction';
  }, []);

  // Filtrer et trier les records valides
  const validRecords = useMemo(() => {
    return [...records]
      .filter((r) => r.end > r.start)
      .sort((a, b) => a.start - b.start);
  }, [records]);

  // Calculer les intervalles et fréquences pour chaque ligne
  const tableData = useMemo(() => {
    return validRecords.map((record, index) => {
      const intervalMs = index > 0 ? record.start - validRecords[index - 1].start : null;
      const intervalStr = intervalMs != null ? formatDuration(intervalMs) : '—';
      const freqStr =
        intervalMs != null && intervalMs > 0 ? formatContractionsPerHour(intervalMs) : '—';

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
    <div className="table-page">
      <p className="subtitle table-page-lead">
        Historique détaillé : pour chaque contraction, la <strong>durée</strong>,
        l'<strong>intervalle</strong> depuis le début de la précédente, et la
        <strong>fréquence</strong> estimée (contractions par heure) dérivée de
        cet intervalle.
      </p>

      <section className="card" aria-labelledby="table-heading">
        <h2 id="table-heading" className="section-title">
          Contractions (ordre chronologique)
        </h2>

        {validRecords.length === 0 ? (
          <p className="empty" id="history-table-empty">
            Aucune contraction à afficher.
          </p>
        ) : (
          <div className="history-table-wrap" role="region" aria-label="Tableau défilable sur petit écran" tabIndex={0}>
            <table className="history-table">
              <thead>
                <tr>
                  <th scope="col">N°</th>
                  <th scope="col">Début</th>
                  <th scope="col">Durée</th>
                  <th scope="col">Intervalle</th>
                  <th scope="col">Fréquence</th>
                  <th scope="col">Note</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{row.index}</th>
                    <td>{dateTimeFmt.format(row.start)}</td>
                    <td>{row.durationStr}</td>
                    <td>{row.intervalStr}</td>
                    <td>{row.freqStr}</td>
                    <td className="history-table-note">
                      {(row.note?.trim() || '—')}
                      {row.intensity && ` [Int. ${row.intensity}]`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="table-footnote">
          <strong>Intervalle</strong> : écart entre le début de cette contraction
          et celui de la ligne précédente. <strong>Fréquence</strong> : ≈ nombre
          de contractions par heure si le rythme restait identique à cet
          intervalle.
        </p>
      </section>

      <p className="settings-back-wrap">
        <a href="#/" className="btn btn-secondary settings-back-link">
          Retour à l'accueil
        </a>
      </p>
    </div>
  );
}
