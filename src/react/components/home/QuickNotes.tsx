import { useState } from 'react';

interface QuickNotesProps {
  onNoteSelect?: (note: string) => void;
}

/**
 * Tags de notes rapides avec icônes SVG modernes (sans emojis)
 */
export function QuickNotes({ onNoteSelect }: QuickNotesProps) {
  const [customNoteOpen, setCustomNoteOpen] = useState(false);
  const [customNote, setCustomNote] = useState('');

  const predefinedNotes = [
    {
      id: 'waters',
      label: 'Rupture des eaux',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          <path d="M12 2.69V12" />
        </svg>
      ),
    },
    {
      id: 'shower',
      label: 'Douche chaude',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="M12 12v9" />
          <path d="M8 17v4" />
          <path d="M16 17v4" />
        </svg>
      ),
    },
    {
      id: 'ball',
      label: 'Ballon de gymnastique',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 0 1 10 10" />
          <path d="M12 22a10 10 0 0 0-10-10" />
          <path d="M2 12h20" />
        </svg>
      ),
    },
    {
      id: 'medication',
      label: 'Médicament pris',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      id: 'rest',
      label: 'Pause / Repos',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M10 15V9" />
          <path d="M14 15V9" />
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
      {predefinedNotes.map((note) => (
        <button
          key={note.id}
          type="button"
          className={`note-tag note-tag--${note.id}`}
          onClick={() => handleNoteClick(note.label)}
        >
          {note.icon}
          <span>{note.label}</span>
        </button>
      ))}

      {customNoteOpen ? (
        <div className="note-tag note-tag--custom" style={{ padding: '0.35rem 0.5rem' }}>
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Note personnelle..."
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
            onKeyDown={(e) => {
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
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Personnalisée</span>
        </button>
      )}
    </div>
  );
}
