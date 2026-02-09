import React from 'react';
import { ChemiResult, WeeklyChemiForecast, ATTRACTION_LEVELS, CHEMI_ATTRIBUTE_LABELS, ChemiAttribute } from '../types';
import { getStrongestAttribute, getWeakestAttribute } from '../utils/chemi-engine';
import MagneticField from './MagneticField';

interface ResultScreenProps {
  result: ChemiResult;
  weeklyForecast: WeeklyChemiForecast | null;
  weeklyUnlocked: boolean;
  onUnlockWeekly: () => void;
  onRetry: () => void;
  adLoading: boolean;
}

/** ECG-style waveform for 5 attributes */
function ECGWaveform({ attributes, color }: { attributes: Record<ChemiAttribute, number>; color: string }) {
  const attrs: ChemiAttribute[] = ['talk', 'humor', 'emotion', 'stability', 'passion'];
  const width = 300;
  const height = 80;
  const padding = 20;
  const segW = (width - padding * 2) / (attrs.length - 1);

  // Build path from attribute scores
  const points = attrs.map((attr, i) => {
    const x = padding + i * segW;
    const normalized = attributes[attr] / 100; // 0~1
    const peakY = height - padding - normalized * (height - padding * 2);
    return { x, y: peakY, attr };
  });

  // Create smooth ECG-like path with peaks
  let d = `M ${points[0].x} ${height / 2}`;
  points.forEach((pt, i) => {
    const baseY = height / 2;
    const preX = pt.x - segW * 0.15;
    const postX = pt.x + segW * 0.15;
    if (i === 0) {
      d += ` L ${preX} ${baseY}`;
    }
    // Sharp peak up
    d += ` L ${pt.x} ${pt.y}`;
    // Back to baseline
    d += ` L ${postX} ${baseY}`;
    // Connect to next
    if (i < points.length - 1) {
      const nextPreX = points[i + 1].x - segW * 0.15;
      d += ` L ${nextPreX} ${baseY}`;
    }
  });
  d += ` L ${width - padding} ${height / 2}`;

  return (
    <div className="ecg-container">
      <svg viewBox={`0 0 ${width} ${height}`} className="ecg-svg">
        {/* Baseline */}
        <line
          x1={padding}
          y1={height / 2}
          x2={width - padding}
          y2={height / 2}
          stroke="#E0E0E0"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        {/* ECG path */}
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ecg-path"
        />
        {/* Peak dots + labels */}
        {points.map((pt, i) => (
          <g key={attrs[i]}>
            <circle cx={pt.x} cy={pt.y} r={3.5} fill={color} />
            <text
              x={pt.x}
              y={height - 4}
              textAnchor="middle"
              fontSize={9}
              fontWeight={600}
              fontFamily="'GmarketSans', sans-serif"
              fill="#757575"
            >
              {CHEMI_ATTRIBUTE_LABELS[attrs[i]]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  weeklyForecast,
  weeklyUnlocked,
  onUnlockWeekly,
  onRetry,
  adLoading,
}) => {
  const strongest = getStrongestAttribute(result.attributes);
  const weakest = getWeakestAttribute(result.attributes);
  const levelClass = ['', 'level-parallel', 'level-lukewarm', 'level-subtle', 'level-strong', 'level-destiny'][result.level.level];

  return (
    <div className={`phase-result ${levelClass}`}>
      {/* Header — Level Name */}
      <div className="result-header">
        <div className="result-emoji">
          {result.emojiPair[0]}{result.emojiPair[1]}
        </div>
        <h2
          className="result-level-text"
          style={{ color: result.level.color }}
        >
          {result.level.name}
        </h2>
        <p className="result-names">
          {result.originalNames[0]} × {result.originalNames[1]}
        </p>
        <p className="result-description">{result.level.description}</p>
      </div>

      {/* Magnetic Field Visualization — 핵심 시각, 가장 크게 */}
      <div className="result-card section-gap">
        <MagneticField
          level={result.level.level}
          name1={result.originalNames[0]}
          name2={result.originalNames[1]}
        />
      </div>

      {/* One-liner — 끌림이 한줄평 */}
      <div className="result-card card section-gap">
        <div className="mascot-oneliner">
          <span className="mascot-oneliner-icon">🧲</span>
          <p className="mascot-oneliner-text">{result.oneLiner}</p>
        </div>
      </div>

      {/* ECG Waveform — 5속성 통합 시각화 */}
      <div className="result-card card section-gap">
        <p className="result-card-title">케미 파동</p>
        <ECGWaveform attributes={result.attributes} color={result.level.color} />
        <div className="ecg-summary">
          <span className="ecg-summary-item ecg-strong">
            <i className="ri-arrow-up-circle-fill" style={{ color: result.level.color }} />
            {CHEMI_ATTRIBUTE_LABELS[strongest.attr]}이 가장 강해!
          </span>
          <span className="ecg-summary-item ecg-weak">
            <i className="ri-arrow-down-circle-fill" style={{ color: '#BDBDBD' }} />
            {CHEMI_ATTRIBUTE_LABELS[weakest.attr]}은 좀 더 키워봐~
          </span>
        </div>
      </div>

      {/* Date Scenario — 정보 덩어리화 (5속성 → 1문장) */}
      <div className="result-card card section-gap">
        <p className="result-card-title">이런 데이트 어때?</p>
        <p className="result-card-content scenario-text">
          {result.dateScenario}
        </p>
      </div>

      {/* Mascot Speech Bubble — 끌림이 조언 */}
      <div className="mascot-advice-section section-gap">
        <div className="mascot-advice-bubble">
          <span className="mascot-advice-icon">🧲</span>
          <div className="speech-bubble">
            <span className="speech-bubble-label">끌림이의 한마디</span>
            <p className="speech-bubble-text">
              {result.level.level >= 4
                ? '끌끌~ 이 케미는 끌림이가 보장해! 자석처럼 딱! 붙어있어~'
                : result.level.level >= 3
                ? '음... 은근히 끌리는 느낌이 있는데? 조금만 더 가까워져봐!'
                : result.level.level >= 2
                ? '아직 자력이 약하지만... 기회는 있어! 공통점을 찾아봐~'
                : '각자의 극이 다른 느낌이야~ 하지만 다름이 매력이 될 수도 있거든!'}
            </p>
          </div>
        </div>
      </div>

      {/* Premium — 주간 케미 전망 */}
      <div className="premium-section section-gap">
        <div className={`premium-card${weeklyUnlocked ? ' unlocked' : ''}`}>
          {weeklyUnlocked && weeklyForecast ? (
            <div className="weekly-content">
              <p className="weekly-title">이번 주 케미 전망</p>
              <div className="weekly-grid">
                {weeklyForecast.forecasts.map((f) => (
                  <div key={f.day} className="weekly-day">
                    <span className="weekly-day-label">{f.label}</span>
                    <span className="weekly-day-emoji">
                      {f.emojiPair[0]}
                    </span>
                    <p className="weekly-day-msg">{f.message}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="premium-locked">
              <span className="premium-locked-icon">🔒</span>
              <p className="premium-locked-title">이번 주 케미 전망</p>
              <p className="premium-locked-desc">
                요일별 두 사람의 케미 변화를 확인해봐!
              </p>
              <button
                className="btn-premium"
                onClick={onUnlockWeekly}
                disabled={adLoading}
              >
                <span className="ad-badge">AD</span>
                {adLoading ? '준비 중...' : '광고 보고 전망 확인하기'}
              </button>
              <p className="ad-notice">광고 시청 후 열람할 수 있어요</p>
            </div>
          )}
        </div>
      </div>

      {/* Retry */}
      <div className="retry-section">
        <button className="btn-secondary" onClick={onRetry}>
          <i className="ri-refresh-line" /> 다른 이름으로 측정하기
        </button>
      </div>
    </div>
  );
};

export default ResultScreen;
