import { useEffect, useState } from 'react';

/**
 * Returns a periodically refreshed timestamp without calling Date.now during render.
 */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, intervalMs);

    return () => window.clearInterval(timerId);
  }, [intervalMs]);

  return now;
}
