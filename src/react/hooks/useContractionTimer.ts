import { useEffect, useState, useRef } from 'react';

interface TimerReturn {
  seconds: number;
  formatted: string;
  progress: number; // 0 à 1 (1 = cercle complet à 60s)
  isRunning: boolean;
}

const MAX_SECONDS = 60;
const CIRCUMFERENCE = 2 * Math.PI * 90; // r = 90

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
      setSeconds(0);
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

  // Formatage MM:SS
  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60
  ).padStart(2, '0')}`;

  // Progression du cercle (0 à 1, 1 = 60 secondes)
  const progress = Math.min(seconds / MAX_SECONDS, 1);

  return {
    seconds,
    formatted,
    progress,
    isRunning: activeStart !== null,
  };
}

/**
 * Calcule le stroke-dashoffset pour le cercle SVG de progression
 */
export function calculateCircleOffset(progress: number): number {
  return CIRCUMFERENCE * (1 - progress);
}
