import { useEffect, useState } from 'react';

export function BreathGuide() {
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');

  useEffect(() => {
    const cycleDuration = 4000; // Match CSS animation duration

    const interval = setInterval(() => {
      setPhase(prev => prev === 'inhale' ? 'exhale' : 'inhale');
    }, cycleDuration);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="breath-guide" data-testid="breath-guide">
      <div className="breath-circle-container">
        <div className="breath-circle animated" />
        <p className="breath-text">
          {phase === 'inhale' ? 'Inspirer...' : 'Expirer...'}
        </p>
      </div>
    </div>
  );
}
