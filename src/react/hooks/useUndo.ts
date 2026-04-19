import { useState, useCallback, useEffect, useRef } from 'react';

const UNDO_MS = 30_000;

interface UndoState {
  visible: boolean;
  remainingTime: number; // secondes restantes
}

export function useUndo(onUndo: (recordId: string) => void) {
  const [undoState, setUndoState] = useState<UndoState>({
    visible: false,
    remainingTime: 0,
  });
  const pendingRecordIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nettoyer les timers au unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const showUndo = useCallback((recordId: string) => {
    // Nettoyer l'état précédent
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    pendingRecordIdRef.current = recordId;
    let remaining = UNDO_MS / 1000;

    setUndoState({ visible: true, remainingTime: remaining });

    // Mise à jour chaque seconde
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setUndoState((prev) => ({ ...prev, remainingTime: remaining }));
    }, 1000);

    // Masquer après 30s
    timeoutRef.current = setTimeout(() => {
      hideUndo();
    }, UNDO_MS);
  }, []);

  const hideUndo = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timerRef.current = null;
    timeoutRef.current = null;
    pendingRecordIdRef.current = null;
    setUndoState({ visible: false, remainingTime: 0 });
  }, []);

  const undo = useCallback(() => {
    const recordId = pendingRecordIdRef.current;
    if (recordId) {
      hideUndo();
      onUndo(recordId);
    }
  }, [onUndo, hideUndo]);

  return {
    undoState,
    showUndo,
    hideUndo,
    undo,
  };
}
