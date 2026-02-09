import React, { useState, useEffect } from 'react';
import { ChemiResult } from '../types';

interface RevealScreenProps {
  result: ChemiResult;
}

const REVEAL_MESSAGES = [
  '자력 측정 중...',
  '끌끌~ 뭔가 느껴지는데?',
  '끌림이가 분석 중이야!',
];

const RevealScreen: React.FC<RevealScreenProps> = ({ result }) => {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx((prev) => {
        if (prev < REVEAL_MESSAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 800);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="phase-reveal">
      <div className="reveal-container">
        {/* Name poles sliding in */}
        <div className="reveal-name left" style={{ color: result.level.color }}>
          {result.originalNames[0]}
        </div>
        <div className="reveal-name right" style={{ color: result.level.color }}>
          {result.originalNames[1]}
        </div>

        {/* Particle burst */}
        <div className="reveal-burst" aria-hidden="true">
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * 360;
            const distance = 40 + (i % 3) * 20;
            return (
              <span
                key={i}
                className="reveal-particle"
                style={{
                  '--burst-x': `${Math.cos((angle * Math.PI) / 180) * distance}px`,
                  '--burst-y': `${Math.sin((angle * Math.PI) / 180) * distance}px`,
                  background: result.level.color,
                  animationDelay: `${0.6 + i * 0.04}s`,
                } as React.CSSProperties}
              />
            );
          })}
        </div>

        {/* Center magnet icon */}
        <div className="reveal-magnet">
          <span className="reveal-magnet-icon">🧲</span>
        </div>

        {/* Message */}
        <p className="reveal-message">{REVEAL_MESSAGES[msgIdx]}</p>
      </div>
    </div>
  );
};

export default RevealScreen;
