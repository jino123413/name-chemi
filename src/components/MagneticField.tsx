import { useMemo } from 'react';

interface MagneticFieldProps {
  level: number; // 1-5
  name1: string;
  name2: string;
  animated?: boolean;
}

interface LevelConfig {
  lineCount: number;
  color: string;
  strokeWidth: number;
  dashArray: string;
  particleCount: number;
  particleColor: string;
  animationDuration: number;
  opacity: number;
}

const LEVEL_CONFIGS: Record<number, LevelConfig> = {
  5: {
    lineCount: 15,
    color: '#FF1744',
    strokeWidth: 3,
    dashArray: '8 12',
    particleCount: 12,
    particleColor: '#FF1744',
    animationDuration: 1.5,
    opacity: 1,
  },
  4: {
    lineCount: 10,
    color: '#FF7043',
    strokeWidth: 2.5,
    dashArray: '8 12',
    particleCount: 6,
    particleColor: '#FF7043',
    animationDuration: 2.5,
    opacity: 0.9,
  },
  3: {
    lineCount: 7,
    color: '#FFA726',
    strokeWidth: 2,
    dashArray: '6 14',
    particleCount: 3,
    particleColor: '#FFA726',
    animationDuration: 3.5,
    opacity: 0.75,
  },
  2: {
    lineCount: 4,
    color: '#BDBDBD',
    strokeWidth: 1.5,
    dashArray: '4 16',
    particleCount: 0,
    particleColor: 'transparent',
    animationDuration: 6,
    opacity: 0.6,
  },
  1: {
    lineCount: 2,
    color: '#90A4AE',
    strokeWidth: 1,
    dashArray: '3 8',
    particleCount: 0,
    particleColor: 'transparent',
    animationDuration: 0,
    opacity: 0.45,
  },
};

function generateFieldLines(config: LevelConfig) {
  const lines: { d: string; delay: number }[] = [];
  const x1 = 60;
  const x2 = 260;
  const cy = 100;
  const midX = (x1 + x2) / 2;

  for (let i = 0; i < config.lineCount; i++) {
    const spread = ((i - (config.lineCount - 1) / 2) / Math.max(config.lineCount - 1, 1)) * 2;
    const curveHeight = spread * 70;

    const cp1y = cy + curveHeight * 0.6;
    const cp2y = cy + curveHeight * 0.6;
    const cp1x = midX - 40;
    const cp2x = midX + 40;

    const d = `M ${x1} ${cy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${cy}`;
    const delay = (i * 0.15) % (config.animationDuration || 1);

    lines.push({ d, delay });
  }

  return lines;
}

function generateParticles(config: LevelConfig) {
  if (config.particleCount === 0) return [];

  const particles: { cx: number; cy: number; r: number; delay: number; opacity: number }[] = [];
  const midX = 160;
  const midY = 100;

  for (let i = 0; i < config.particleCount; i++) {
    const angle = (i / config.particleCount) * Math.PI * 2;
    const radius = 15 + Math.random() * 25;
    const cx = midX + Math.cos(angle) * radius;
    const cy = midY + Math.sin(angle) * radius;
    const r = 1.5 + Math.random() * 2;
    const delay = Math.random() * 2;
    const opacity = 0.4 + Math.random() * 0.6;

    particles.push({ cx, cy, r, delay, opacity });
  }

  return particles;
}

export default function MagneticField({ level, name1, name2, animated = true }: MagneticFieldProps) {
  const clampedLevel = Math.max(1, Math.min(5, Math.round(level)));
  const config = LEVEL_CONFIGS[clampedLevel];

  const lines = useMemo(() => generateFieldLines(config), [clampedLevel]);
  const particles = useMemo(() => generateParticles(config), [clampedLevel]);

  const poleRadius = 22;
  const x1 = 60;
  const x2 = 260;
  const cy = 100;

  return (
    <svg
      className="magnetic-field-svg"
      viewBox="0 0 320 200"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {animated && config.animationDuration > 0 && (
          <style>{`
            @keyframes dash-flow-${clampedLevel} {
              from { stroke-dashoffset: 40; }
              to { stroke-dashoffset: 0; }
            }
            @keyframes particle-pulse {
              0%, 100% { opacity: 0.3; r: 1.5; }
              50% { opacity: 1; r: 3; }
            }
            @keyframes pole-glow-${clampedLevel} {
              0%, 100% { opacity: 0.15; }
              50% { opacity: 0.35; }
            }
            @keyframes wobble-line {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(1px); }
            }
          `}</style>
        )}
      </defs>

      {/* Pole glow */}
      {clampedLevel >= 3 && (
        <>
          <circle
            cx={x1}
            cy={cy}
            r={poleRadius + 8}
            fill={config.color}
            opacity={0.15}
            style={animated && config.animationDuration > 0 ? {
              animation: `pole-glow-${clampedLevel} ${config.animationDuration}s ease-in-out infinite`,
            } : undefined}
          />
          <circle
            cx={x2}
            cy={cy}
            r={poleRadius + 8}
            fill={config.color}
            opacity={0.15}
            style={animated && config.animationDuration > 0 ? {
              animation: `pole-glow-${clampedLevel} ${config.animationDuration}s ease-in-out infinite`,
              animationDelay: `${config.animationDuration / 2}s`,
            } : undefined}
          />
        </>
      )}

      {/* Field lines */}
      {lines.map((line, i) => (
        <path
          key={i}
          d={line.d}
          className="field-line"
          stroke={config.color}
          strokeWidth={config.strokeWidth}
          strokeDasharray={config.dashArray}
          opacity={config.opacity - (i * 0.02)}
          style={animated && config.animationDuration > 0 ? {
            animation: clampedLevel === 2
              ? `wobble-line ${config.animationDuration}s ease-in-out infinite`
              : `dash-flow-${clampedLevel} ${config.animationDuration}s linear infinite`,
            animationDelay: `${line.delay}s`,
          } : clampedLevel === 1 ? {
            strokeDasharray: config.dashArray,
          } : undefined}
        />
      ))}

      {/* Particles (level 3+) */}
      {animated && particles.map((p, i) => (
        <circle
          key={`p-${i}`}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill={config.particleColor}
          opacity={p.opacity}
          style={{
            animation: `particle-pulse ${1.5 + p.delay * 0.5}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}

      {/* Pole circles */}
      <circle
        cx={x1}
        cy={cy}
        r={poleRadius}
        fill="#FFFFFF"
        stroke={config.color}
        strokeWidth={2}
      />
      <circle
        cx={x2}
        cy={cy}
        r={poleRadius}
        fill="#FFFFFF"
        stroke={config.color}
        strokeWidth={2}
      />

      {/* Name texts */}
      <text
        x={x1}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={name1.length > 3 ? 10 : 12}
        fontWeight={700}
        fontFamily="'GmarketSans', sans-serif"
        fill={config.color}
      >
        {name1.length > 4 ? name1.slice(0, 4) : name1}
      </text>
      <text
        x={x2}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={name2.length > 3 ? 10 : 12}
        fontWeight={700}
        fontFamily="'GmarketSans', sans-serif"
        fill={config.color}
      >
        {name2.length > 4 ? name2.slice(0, 4) : name2}
      </text>

      {/* Center connection indicator for high levels */}
      {clampedLevel >= 4 && (
        <circle
          cx={160}
          cy={cy}
          r={clampedLevel === 5 ? 5 : 3}
          fill={config.color}
          opacity={0.6}
          style={animated ? {
            animation: `particle-pulse ${config.animationDuration * 0.5}s ease-in-out infinite`,
          } : undefined}
        />
      )}
    </svg>
  );
}
