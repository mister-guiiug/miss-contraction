import { useEffect, useState, useRef } from 'react';

interface RestTimerReturn {
  seconds: number;
  formatted: string;
}

/**
 * Gère le chronomètre de repos (temps depuis la fin de la dernière contraction)
 */
export function useRestTimer(
  lastEnd: number | null,
  isPaused = false
): RestTimerReturn {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const effectiveStartRef = useRef<number | null>(null);
  const lastStartInputRef = useRef<number | null>(null);
  const pauseStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (lastStartInputRef.current !== lastEnd) {
      lastStartInputRef.current = lastEnd;
      effectiveStartRef.current = lastEnd;
      pauseStartedAtRef.current = null;
      setSeconds(0);
    }

    if (lastEnd === null) {
      effectiveStartRef.current = null;
      pauseStartedAtRef.current = null;
      return;
    }

    if (effectiveStartRef.current === null) {
      effectiveStartRef.current = lastEnd;
    }

    if (isPaused) {
      if (pauseStartedAtRef.current === null) {
        pauseStartedAtRef.current = Date.now();
      }
      return;
    }

    if (
      pauseStartedAtRef.current !== null &&
      effectiveStartRef.current !== null
    ) {
      // Décale le point de départ pour ne pas compter le temps passé en pause.
      effectiveStartRef.current += Date.now() - pauseStartedAtRef.current;
      pauseStartedAtRef.current = null;
    }

    const updateSeconds = () => {
      if (effectiveStartRef.current === null) {
        setSeconds(0);
        return;
      }
      const elapsed = Math.floor(
        (Date.now() - effectiveStartRef.current) / 1000
      );
      setSeconds(Math.max(0, elapsed));
    };

    updateSeconds();
    intervalRef.current = setInterval(updateSeconds, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [lastEnd, isPaused]);

  const secondsValue = lastEnd === null ? 0 : seconds;

  // Formatage MM:SS ou HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const parts = [];
    if (hrs > 0) parts.push(String(hrs).padStart(2, '0'));
    parts.push(String(mins).padStart(2, '0'));
    parts.push(String(secs).padStart(2, '0'));

    return parts.join(':');
  };

  return {
    seconds: secondsValue,
    formatted: formatTime(secondsValue),
  };
}
