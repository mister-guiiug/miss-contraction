import { useEffect, useState, useRef } from 'react';

interface TimerReturn {
  seconds: number;
  formatted: string;
  progress: number; // 0 à 1 (1 = cercle complet à 60s)
  isRunning: boolean;
}

const MAX_SECONDS = 60;

/**
 * Gère le timer de contraction
 * Met à jour chaque seconde quand activeStart est défini
 */
export function useContractionTimer(activeStart: number | null): TimerReturn {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activeStart === null) {
      // Timer arrêté
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Timer démarré - mise à jour immédiate
    const updateSeconds = () => {
      const elapsed = Math.floor((Date.now() - activeStart) / 1000);
      setSeconds(elapsed);
    };

    updateSeconds();

    // Puis intervalle chaque seconde
    intervalRef.current = setInterval(updateSeconds, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [activeStart]);

  const secondsValue = activeStart === null ? 0 : seconds;

  // Formatage MM:SS
  const formatted = `${String(Math.floor(secondsValue / 60)).padStart(2, '0')}:${String(
    secondsValue % 60
  ).padStart(2, '0')}`;

  // Progression du cercle (0 à 1, 1 = 60 secondes)
  const progress = Math.min(secondsValue / MAX_SECONDS, 1);

  return {
    seconds: secondsValue,
    formatted,
    progress,
    isRunning: activeStart !== null,
  };
}
