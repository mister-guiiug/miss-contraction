import { useEffect, useState, useRef } from 'react';

interface RestTimerReturn {
  seconds: number;
  formatted: string;
}

/**
 * Gère le chronomètre de repos (temps depuis la fin de la dernière contraction)
 */
export function useRestTimer(lastEnd: number | null): RestTimerReturn {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (lastEnd === null) {
      setSeconds(0);
      return;
    }

    const updateSeconds = () => {
      const elapsed = Math.floor((Date.now() - lastEnd) / 1000);
      setSeconds(Math.max(0, elapsed));
    };

    updateSeconds();
    intervalRef.current = setInterval(updateSeconds, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [lastEnd]);

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
    seconds,
    formatted: formatTime(seconds),
  };
}
