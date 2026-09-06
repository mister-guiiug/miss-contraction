import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { t } from '../../../i18n';
import { noteLabel, type NoteTypeId } from '../../../noteTypes';

interface QuickNotesProps {
  onNoteSelect?: (note: string) => void;
}

/**
 * Tags de notes rapides avec icônes SVG modernes (sans emojis)
 */
export function QuickNotes({ onNoteSelect }: QuickNotesProps) {
  const [customNoteOpen, setCustomNoteOpen] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const language = useAppStore(state => state.settings.language);

  const predefinedNotes = [
    {
      id: 'waters' as NoteTypeId,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          <path d="M12 2.69V12" />
        </svg>
      ),
    },
    {
      id: 'shower' as NoteTypeId,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="M12 12v9" />
          <path d="M8 17v4" />
          <path d="M16 17v4" />
        </svg>
      ),
    },
    {
      id: 'ball' as NoteTypeId,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 10 10" />
          <path d="M12 22a10 10 0 0 0-10-10" />
          <path d="M2 12h20" />
        </svg>
      ),
    },
    {
      id: 'medication' as NoteTypeId,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 9h6" />
          <path d="M9 12h6" />
          <path d="M9 15h6" />
          <path d="M9 4v4" />
          <path d="M15 4v4" />
        </svg>
      ),
    },
    {
      id: 'rest' as NoteTypeId,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M10 15V9" />
          <path d="M14 15V9" />
        </svg>
      ),
    },
    {
      id: 'walk' as NoteTypeId,
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z" />
          <path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z" />
          <path d="M16 17h4" />
          <path d="M4 13h4" />
        </svg>
      ),
    },
  ];

  const handleNoteClick = (note: string) => {
    if (onNoteSelect) {
      onNoteSelect(note);
    }
  };

  const handleCustomSubmit = () => {
    if (customNote.trim()) {
      handleNoteClick(customNote.trim());
      setCustomNote('');
      setCustomNoteOpen(false);
    }
  };

  return (
    <div className="quick-notes">
      {predefinedNotes.map(note => (
        <button
          key={note.id}
          type="button"
          className={`note-tag note-tag--${note.id}`}
          data-testid={`note-chip-${note.id}`}
          onClick={() => handleNoteClick(noteLabel(language, note.id))}
        >
          {note.icon}
          <span>{noteLabel(language, note.id)}</span>
        </button>
      ))}

      {customNoteOpen ? (
        <div
          className="note-tag note-tag--custom"
          style={{ padding: '0.35rem 0.5rem' }}
        >
          <input
            type="text"
            value={customNote}
            onChange={e => setCustomNote(e.target.value)}
            placeholder={t(language, 'quicknotes.placeholder')}
            className="note-custom-input"
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '0.75rem',
              fontWeight: '600',
              width: '120px',
              color: 'inherit',
            }}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleCustomSubmit();
              } else if (e.key === 'Escape') {
                setCustomNoteOpen(false);
                setCustomNote('');
              }
            }}
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: '0',
              display: 'flex',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              width="16"
              height="16"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="note-tag note-tag--custom"
          onClick={() => setCustomNoteOpen(true)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{t(language, 'quicknotes.custom')}</span>
        </button>
      )}
    </div>
  );
}
