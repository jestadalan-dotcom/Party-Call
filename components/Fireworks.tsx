import React, { useEffect, useCallback } from 'react';

// Declaration for the global confetti object
declare const confetti: any;

interface FireworksProps {
  active: boolean;
}

const Fireworks: React.FC<FireworksProps> = ({ active }) => {
  const fire = useCallback(() => {
    if (typeof confetti === 'undefined') return;
    
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fireParticle(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fireParticle(0.25, {
      spread: 26,
      startVelocity: 55,
    });
    fireParticle(0.2, {
      spread: 60,
    });
    fireParticle(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fireParticle(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fireParticle(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    
    // Initial blast
    fire();
    
    // Ongoing celebration
    const interval = setInterval(() => {
      fire();
    }, 2000);

    return () => clearInterval(interval);
  }, [active, fire]);

  return null;
};

export default Fireworks;