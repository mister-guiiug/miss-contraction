/**
 * Retour haptique — encapsulation sûre de l'API Vibration.
 *
 * Vivait dans `src/react/hooks/useWakeLock.ts`, qui n'existe plus depuis que
 * le verrou d'écran vient du socle (`@mister-guiiug/dev-wpa-config`). La
 * vibration reste locale : l'app la conditionne à un réglage utilisateur
 * (`settings.vibrationEnabled`) que le helper prend en second argument.
 */
export function vibrate(pattern: number | number[], enabled: boolean): void {
  if (!enabled) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}
