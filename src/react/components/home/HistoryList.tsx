import {
  useState,
  useCallback,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useAppStore } from '../../store/useAppStore';
import { formatDateTime } from '../../../utils/formatStats';
import { formatDuration } from '../../../utils/formatDuration';
import type { ContractionRecord } from '../../../storage';
import { t } from '../../../i18n';

type EditDialogState = {
  record: ContractionRecord | null;
};

export function HistoryList() {
  const { records, deleteRecord, updateRecord, clearRecords, settings } =
    useAppStore();
  const language = settings.language;
  const [editDialog, setEditDialog] = useState<EditDialogState>({
    record: null,
  });

  const validRecords = [...records]
    .filter(r => r.end > r.start)
    .sort((a, b) => b.start - a.start);

  const handleClearAll = useCallback(() => {
    if (confirm(t(language, 'history.confirmClear'))) {
      clearRecords();
    }
  }, [clearRecords, language]);

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm(t(language, 'history.confirmDelete'))) {
        deleteRecord(id);
      }
    },
    [deleteRecord, language]
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
      <section
        className="card"
        aria-labelledby="history-heading"
        data-testid="history-list"
      >
        <div className="section-head">
          <h2 id="history-heading" className="section-title">
            {t(language, 'history.title')}
          </h2>
          <div
            className="section-actions"
            role="group"
            aria-label={t(language, 'history.actionsAria')}
          >
            <button
              type="button"
              className="btn btn-ghost btn-small"
              id="btn-clear-history"
              data-testid="clear-history-btn"
              onClick={handleClearAll}
            >
              {t(language, 'history.clear')}
            </button>
          </div>
        </div>

        {validRecords.length === 0 ? (
          <p className="empty" id="history-empty" data-testid="history-empty">
            {t(language, 'history.empty')}
          </p>
        ) : (
          <ul
            className="timeline"
            id="history-list"
            role="list"
            data-testid="history-items"
          >
            {validRecords.map((rec, index) => (
              <HistoryItem
                key={rec.id}
                record={rec}
                occurrenceNum={validRecords.length - index}
                isLatest={index === 0}
                previousRecord={
                  index < validRecords.length - 1
                    ? validRecords[index + 1]
                    : undefined
                }
                onEdit={handleEdit}
                onDelete={handleDelete}
                language={language}
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
          language={language}
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
  language,
}: {
  record: ContractionRecord;
  occurrenceNum: number;
  isLatest: boolean;
  previousRecord?: ContractionRecord;
  onEdit: (rec: ContractionRecord) => void;
  onDelete: (id: string) => void;
  language: ReturnType<typeof useAppStore>['settings']['language'];
}) {
  const duration = record.end - record.start;
  const intervalPrev = previousRecord
    ? formatDuration(record.start - previousRecord.start)
    : '-';

  const intensityHtml = record.intensity ? (
    <span
      className={`timeline-intensity timeline-intensity--${record.intensity}`}
      title={`${t(language, 'history.intensity')} ${record.intensity}`}
    >
      <span className="sr-only">{t(language, 'history.intensity')}</span>{' '}
      {record.intensity}
    </span>
  ) : null;

  return (
    <li
      className={`timeline-item ${isLatest ? 'timeline-item--latest' : ''}`}
      data-testid={`history-item-${record.id}`}
    >
      <div className="timeline-marker" aria-hidden="true" />

      <div className="timeline-body">
        <div className="timeline-time-row">
          <span
            className="timeline-num"
            title={`#${occurrenceNum}`}
            data-testid="occurrence-num"
          >
            {occurrenceNum}
          </span>
          <time
            className="timeline-time"
            dateTime={new Date(record.start).toISOString()}
            data-testid="record-time"
          >
            {formatDateTime(record.start)}
          </time>
          {intensityHtml}
        </div>

        <p className="timeline-meta">
          <span className="timeline-stat" data-testid="record-duration">
            {t(language, 'history.duration')}{' '}
            <strong>{formatDuration(duration)}</strong>
          </span>
          <span className="timeline-sep" aria-hidden="true">
            .
          </span>
          <span className="timeline-stat" data-testid="record-interval">
            {t(language, 'history.interval')} <strong>{intervalPrev}</strong>
          </span>
        </p>

        {record.note && (
          <p className="timeline-note" data-testid="record-note">
            {record.note}
          </p>
        )}

        <div className="timeline-actions">
          <button
            type="button"
            className="btn btn-ghost btn-tiny"
            data-action="edit"
            data-id={record.id}
            data-testid={`edit-record-btn-${record.id}`}
            onClick={() => onEdit(record)}
            aria-label={t(language, 'history.editAria')}
          >
            {t(language, 'history.edit')}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-tiny timeline-action-danger"
            data-action="delete"
            data-id={record.id}
            data-testid={`delete-record-btn-${record.id}`}
            onClick={() => onDelete(record.id)}
            aria-label={t(language, 'history.deleteAria')}
          >
            {t(language, 'history.delete')}
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
  language,
}: {
  record: ContractionRecord;
  onSave: (updates: Partial<ContractionRecord>) => void;
  onClose: () => void;
  language: ReturnType<typeof useAppStore>['settings']['language'];
}) {
  const [start, setStart] = useState(toDatetimeLocalValue(record.start));
  const [end, setEnd] = useState(toDatetimeLocalValue(record.end));
  const [note, setNote] = useState(record.note ?? '');
  const [intensity, setIntensity] = useState<number | undefined>(
    record.intensity
  );
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();

    if (isNaN(startMs) || isNaN(endMs)) {
      setError(t(language, 'history.errorInvalidDates'));
      return;
    }
    if (endMs <= startMs) {
      setError(t(language, 'history.errorEndAfterStart'));
      return;
    }

    onSave({
      start: startMs,
      end: endMs,
      note: note.trim() || undefined,
      intensity,
    });
  };

  const handleIntensityChange = (value: number) => {
    setIntensity(intensity === value ? undefined : value);
  };

  return (
    <dialog className="edit-dialog" open data-testid="edit-dialog">
      <form className="edit-dialog-form" onSubmit={handleSubmit}>
        <h3
          id="edit-dialog-title"
          className="edit-dialog-title"
          data-testid="edit-dialog-title"
        >
          {t(language, 'history.editTitle')}
        </h3>
        {error && (
          <p
            className="edit-dialog-error"
            role="alert"
            data-testid="edit-dialog-error"
          >
            {error}
          </p>
        )}

        <label className="field">
          <span>{t(language, 'history.start')}</span>
          <input
            type="datetime-local"
            id="edit-start"
            data-testid="edit-start-input"
            value={start}
            onChange={e => setStart(e.target.value)}
            step="1"
            required
          />
        </label>

        <label className="field">
          <span>{t(language, 'history.end')}</span>
          <input
            type="datetime-local"
            id="edit-end"
            data-testid="edit-end-input"
            value={end}
            onChange={e => setEnd(e.target.value)}
            step="1"
            required
          />
        </label>

        <div className="field">
          <span className="field-label">
            {t(language, 'history.painIntensity')}
          </span>
          <div
            className="intensity-picker"
            id="edit-intensity-picker"
            data-testid="edit-intensity-picker"
          >
            {[1, 2, 3, 4, 5].map(value => (
              <label
                key={value}
                className={`btn-intensity ${intensity === value ? 'selected' : ''}`}
                data-testid={`edit-intensity-option-${value}`}
              >
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
              data-testid="edit-intensity-clear-btn"
              onClick={() => setIntensity(undefined)}
            >
              {t(language, 'history.clearIntensity')}
            </button>
          </div>
        </div>

        <label className="field">
          <span>{t(language, 'history.noteOptional')}</span>
          <textarea
            id="edit-note"
            data-testid="edit-note-textarea"
            rows={2}
            maxLength={240}
            placeholder={t(language, 'history.notePlaceholder')}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </label>

        <div
          className="quick-notes"
          id="edit-quick-notes"
          data-testid="edit-quick-notes"
        >
          <button
            type="button"
            className="btn btn-ghost btn-tiny"
            data-note="Balloon"
            data-testid="quick-note-balloon"
            onClick={() => addQuickNote(setNote, 'Balloon')}
          >
            Balloon
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-tiny"
            data-note="Walk"
            data-testid="quick-note-walk"
            onClick={() => addQuickNote(setNote, 'Walk')}
          >
            Walk
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-tiny"
            data-note="Rest"
            data-testid="quick-note-rest"
            onClick={() => addQuickNote(setNote, 'Rest')}
          >
            Rest
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-tiny"
            data-note="Shower"
            data-testid="quick-note-shower"
            onClick={() => addQuickNote(setNote, 'Shower')}
          >
            Shower
          </button>
        </div>

        <div className="edit-dialog-buttons">
          <button
            type="button"
            className="btn btn-secondary"
            id="edit-dialog-cancel"
            data-testid="edit-dialog-cancel-btn"
            onClick={onClose}
          >
            {t(language, 'history.cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            data-testid="edit-dialog-save-btn"
          >
            {t(language, 'history.save')}
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

function addQuickNote(setNote: Dispatch<SetStateAction<string>>, tag: string) {
  setNote(prev => {
    const cur = prev.trim();
    if (!cur) {
      return tag;
    }
    if (!cur.includes(tag)) {
      return `${cur}, ${tag}`;
    }
    return cur;
  });
}
