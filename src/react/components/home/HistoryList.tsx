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
      if (confirm('Supprimer cette contraction ?')) {
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
            {validRecords.map((rec) => (
              <HistoryItem
                key={rec.id}
                record={rec}
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
  onEdit,
  onDelete,
}: {
  record: ContractionRecord;
  onEdit: (rec: ContractionRecord) => void;
  onDelete: (id: string) => void;
}) {
  const duration = record.end - record.start;
  const intensityBadge = record.intensity ? (
    <span className={`timeline-badge timeline-badge--intensity-${record.intensity}`}>
      {record.intensity}
    </span>
  ) : null;

  return (
    <li className="timeline-item">
      <div className="timeline-item-content">
        <time className="timeline-item-time" dateTime={new Date(record.start).toISOString()}>
          {formatDateTime(record.start)}
        </time>
        <span className="timeline-item-duration">{formatDuration(duration)}</span>
        {intensityBadge}
        {record.note && <p className="timeline-item-note">{record.note}</p>}
      </div>
      <div className="timeline-item-actions">
        <button
          type="button"
          className="btn btn-ghost btn-tiny"
          onClick={() => onEdit(record)}
          aria-label="Modifier"
        >
          ✏️
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-tiny"
          onClick={() => onDelete(record.id)}
          aria-label="Supprimer"
        >
          🗑️
        </button>
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
      setError('Dates invalides');
      return;
    }
    if (endMs <= startMs) {
      setError('La fin doit être après le début');
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
        <h3 className="edit-dialog-title">Modifier la contraction</h3>
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

        <div className="edit-dialog-buttons">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
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
