import { useEffect, useState } from 'react';

/**
 * Toggle du mode contraste élevé pour l'accessibilité
 */
export function HighContrastToggle() {
  const [highContrast, setHighContrast] = useState(() => {
    try {
      return localStorage.getItem('mc_high_contrast') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (highContrast) {
      document.documentElement.setAttribute('data-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-contrast');
    }
  }, [highContrast]);

  const handleToggle = () => {
    const next = !highContrast;
    setHighContrast(next);
    try {
      localStorage.setItem('mc_high_contrast', String(next));
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <label className="field field-check">
      <input
        type="checkbox"
        id="high-contrast-check"
        checked={highContrast}
        onChange={handleToggle}
      />
      <span>
        Mode contraste élevé (pour une meilleure lisibilité)
      </span>
    </label>
  );
}
