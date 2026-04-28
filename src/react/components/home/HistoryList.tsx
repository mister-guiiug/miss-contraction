import { useState, useCallback } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatDateTime } from '../../../utils/formatStats';
import { formatDuration } from '../../../utils/formatDuration';
import type { ContractionRecord } from '../../../storage';

type EditDialogState = {
  record: ContractionRecord | null;
};

export function HistoryList() {
  const { records, deleteRecord, updateRecord, clearRecords } = useAppStore();
  const [editDialog, setEditDialog] = useState<EditDialogState>({ record: null });

  const validRecords = [...records]
    .filter((r) => r.end > r.start)
    .sort((a, b) => b.start - a.start);

  const handleClearAll = useCallback(() => {
    if (confirm('Effacer tout l\'historique sur cet appareil ?')) {
      clearRecords();
    }
  }, [clearRecords]);

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm('Supprimer cette contraction de l\'historique ?')) {
        deleteRecord(id);
      }
    },
    [deleteRecord]
  );

  const handleEdit = useCallback((record: ContractionRecord) => {
    setEditDialog({ record });
  }, []);

  const handleSaveEdit = useCallback(
    (updates: Partial<ContractionRecord>) => {
      if (editDialog.record) {
        updateRecord(editDialog.record.id, updates);
        setEditDialog({ record: null });
      }
    },
    [editDialog.record, updateRecord]
  );

  return (
    <>
      <section className="card" aria-labelledby="history-heading">
        <div className="section-head">
          <h2 id="history-heading" className="section-title">Historique</h2>
          <div className="section-actions" role="group" aria-label="Actions historique">
            <button
              type="button"
              className="btn btn-ghost btn-small"
              id="btn-clear-history"
              onClick={handleClearAll}
            >
              Effacer l'historique
            </button>
          </div>
        </div>

        {validRecords.length === 0 ? (
          <p className="empty" id="history-empty">
            Aucune contraction enregistrée pour le moment.
          </p>
        ) : (
          <ul className="timeline" id="history-list" role="list">
            {validRecords.map((rec, index) => (
              <HistoryItem
                key={rec.id}
                record={rec}
                occurrenceNum={validRecords.length - index}
                isLatest={index === 0}
                previousRecord={index < validRecords.length - 1 ? validRecords[index + 1] : undefined}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </section>

      {editDialog.record && (
        <EditDialog
          record={editDialog.record}
          onSave={handleSaveEdit}
          onClose={() => setEditDialog({ record: null })}
        />
      )}
    </>
  );
}

function HistoryItem({
  record,
  occurrenceNum,
  isLatest,
  previousRecord,
  onEdit,
  onDelete,
}: {
  record: ContractionRecord;
  occurrenceNum: number;
  isLatest: boolean;
  previousRecord?: ContractionRecord;
  onEdit: (rec: ContractionRecord) => void;
  onDelete: (id: string) => void;
}) {
  const duration = record.end - record.start;
  const intervalPrev = previousRecord
    ? formatDuration(record.start - previousRecord.start)
    : '—';

  const intensityHtml = record.intensity ? (
    <span className={`timeline-intensity timeline-intensity--${record.intensity}`} title={`Intensité ${record.intensity}`}>
      <span className="sr-only">Intensité</span> {record.intensity}
    </span>
  ) : null;

  return (
    <li className={`timeline-item ${isLatest ? 'timeline-item--latest' : ''}`}>
      <div className="timeline-marker" aria-hidden="true" />

      <div className="timeline-body">
        <div className="timeline-time-row">
          <span className="timeline-num" title={`Contraction n°${occurrenceNum}`}>
            {occurrenceNum}
          </span>
          <time className="timeline-time" dateTime={new Date(record.start).toISOString()}>
            {formatDateTime(record.start)}
          </time>
          {intensityHtml}
        </div>

        <p className="timeline-meta">
          <span className="timeline-stat">
            Durée <strong>{formatDuration(duration)}</strong>
          </span>
          <span className="timeline-sep" aria-hidden="true">·</span>
          <span className="timeline-stat">
            Écart <strong>{intervalPrev}</strong>
          </span>
        </p>

        {record.note && <p className="timeline-note">{record.note}</p>}

        <div className="timeline-actions">
          <button
            type="button"
            className="btn btn-ghost btn-tiny"
            data-action="edit"
            data-id={record.id}
            onClick={() => onEdit(record)}
            aria-label="Modifier cette contraction"
          >
            Modifier
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-tiny timeline-action-danger"
            data-action="delete"
            data-id={record.id}
            onClick={() => onDelete(record.id)}
            aria-label="Supprimer cette contraction"
          >
            Supprimer
          </button>
        </div>
      </div>
    </li>
  );
}

function EditDialog({
  record,
  onSave,
  onClose,
}: {
  record: ContractionRecord;
  onSave: (updates: Partial<ContractionRecord>) => void;
  onClose: () => void;
}) {
  const [start, setStart] = useState(toDatetimeLocalValue(record.start));
  const [end, setEnd] = useState(toDatetimeLocalValue(record.end));
  const [note, setNote] = useState(record.note ?? '');
  const [intensity, setIntensity] = useState<number | undefined>(record.intensity);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();

    if (isNaN(startMs) || isNaN(endMs)) {
      setError('Vérifiez les dates saisies.');
      return;
    }
    if (endMs <= startMs) {
      setError('La fin doit être après le début.');
      return;
    }

    const updates: Partial<ContractionRecord> = {
      start: startMs,
      end: endMs,
      note: note.trim() || undefined,
      intensity,
    };

    onSave(updates);
  };

  const handleIntensityChange = (value: number) => {
    setIntensity(intensity === value ? undefined : value);
  };

  return (
    <dialog className="edit-dialog" open>
      <form className="edit-dialog-form" onSubmit={handleSubmit}>
        <h3 id="edit-dialog-title" className="edit-dialog-title">Modifier la contraction</h3>
        {error && <p className="edit-dialog-error" role="alert">{error}</p>}

        <label className="field">
          <span>Début</span>
          <input
            type="datetime-local"
            id="edit-start"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            step="1"
            required
          />
        </label>

        <label className="field">
          <span>Fin</span>
          <input
            type="datetime-local"
            id="edit-end"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            step="1"
            required
          />
        </label>

        <div className="field">
          <span className="field-label">Intensité de la douleur</span>
          <div className="intensity-picker" id="edit-intensity-picker">
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className={`btn-intensity ${intensity === value ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="intensity"
                  value={value}
                  checked={intensity === value}
                  onChange={() => handleIntensityChange(value)}
                  className="sr-only"
                />
                {value}
              </label>
            ))}
            <button
              type="button"
              className="btn btn-ghost btn-tiny"
              id="btn-edit-intensity-clear"
              onClick={() => setIntensity(undefined)}
            >
              Effacer
            </button>
          </div>
        </div>

        <label className="field">
          <span>Note (optionnelle)</span>
          <textarea
            id="edit-note"
            rows={2}
            maxLength={240}
            placeholder="Ex. plus intense, repos…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <div className="quick-notes" id="edit-quick-notes">
          <button type="button" className="btn btn-ghost btn-tiny" data-note="Ballon" onClick={() => addQuickNote(setNote, 'Ballon')}>
            🎈 Ballon
          </button>
          <button type="button" className="btn btn-ghost btn-tiny" data-note="Marche" onClick={() => addQuickNote(setNote, 'Marche')}>
            🚶 Marche
          </button>
          <button type="button" className="btn btn-ghost btn-tiny" data-note="Repos" onClick={() => addQuickNote(setNote, 'Repos')}>
            🛌 Repos
          </button>
          <button type="button" className="btn btn-ghost btn-tiny" data-note="Douche" onClick={() => addQuickNote(setNote, 'Douche')}>
            🚿 Douche
          </button>
        </div>

        <div className="edit-dialog-buttons">
          <button type="button" className="btn btn-secondary" id="edit-dialog-cancel" onClick={onClose}>
            Annuler
          </button>
          <button type="submit" className="btn btn-primary">
            Enregistrer
          </button>
        </div>
      </form>
    </dialog>
  );
}

function toDatetimeLocalValue(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function addQuickNote(setNote: (note: string) => void, tag: string) {
  setNote((prev) => {
    const cur = prev.trim();
    if (!cur) {
      return tag;
    } else if (!cur.includes(tag)) {
      return `${cur}, ${tag}`;
    }
    return cur;
  });
}
