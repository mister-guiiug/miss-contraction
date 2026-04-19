import { useEffect, useRef } from 'react';

/**
 * Hook pour gérer le Wake Lock API (garder l'écran allumé)
 */
export function useWakeLock(enabled: boolean, active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || !active || !navigator.wakeLock) {
      // Relâcher le wake lock si désactivé ou pas de contraction en cours
      releaseSafe();
      return;
    }

    let cancelled = false;

    const acquire = async () => {
      if (cancelled) return;
      try {
        const sentinel = await navigator.wakeLock.request('screen');
        if (cancelled) {
          sentinel.release();
          return;
        }
        sentinelRef.current = sentinel;
        sentinel.addEventListener('release', () => {
          sentinelRef.current = null;
        });
      } catch {
        // Ignorer les erreurs (navigateur ne supporte pas, permission refusée, etc.)
      }
    };

    acquire();

    return () => {
      cancelled = true;
      releaseSafe();
    };
  }, [enabled, active]);

  const releaseSafe = async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch {
        /* ignore */
      }
      sentinelRef.current = null;
    }
  };
}

/**
 * Trigger une vibration si supporté
 */
export function vibrate(pattern: number | number[], enabled: boolean): void {
  if (!enabled) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}
