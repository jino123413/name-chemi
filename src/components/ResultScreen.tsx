import React, { useState } from 'react';
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

// ─── 한글 받침(종성) 판별 ───
function hasJongseong(str: string): boolean {
  const last = str.charCodeAt(str.length - 1);
  if (last < 0xAC00 || last > 0xD7A3) return false;
  return (last - 0xAC00) % 28 !== 0;
}

// ─── Color palette ───
const C1 = '#FF7043'; // warm orange (primary)
const C2 = '#FFAB91'; // peach (accent)

// ─── Inline SVG Icons ───
const SvgArrowUp = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={color} style={{ verticalAlign: 'middle', marginRight: 4 }}>
    <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 5l-5 5h3v4h4v-4h3l-5-5z"/>
  </svg>
);

const SvgArrowDown = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={color} style={{ verticalAlign: 'middle', marginRight: 4 }}>
    <path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 17l5-5h-3V10h-4v4H7l5 5z"/>
  </svg>
);

const SvgRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: 4 }}>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
    <polyline points="21 3 21 8 16 8"/>
    <polyline points="3 21 3 16 8 16"/>
  </svg>
);

const SvgLock = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

// ─── Day Icons — 20개 인라인 SVG (warm orange 2색) ───
const dayIcons: Record<string, React.ReactNode> = {
  // sun
  '☀️': <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill={C1}/>{[0,45,90,135,180,225,270,315].map(a=><line key={a} x1={12+8*Math.cos(a*Math.PI/180)} y1={12+8*Math.sin(a*Math.PI/180)} x2={12+10*Math.cos(a*Math.PI/180)} y2={12+10*Math.sin(a*Math.PI/180)} stroke={C2} strokeWidth="2" strokeLinecap="round"/>)}</svg>,
  // flower
  '🌸': <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill={C1}/>{[0,72,144,216,288].map(a=><circle key={a} cx={12+5*Math.cos(a*Math.PI/180)} cy={12+5*Math.sin(a*Math.PI/180)} r="3.5" fill={C2} opacity="0.7"/>)}</svg>,
  // cup
  '☕': <svg width="22" height="22" viewBox="0 0 24 24"><rect x="5" y="8" width="11" height="10" rx="2" fill={C2}/><path d="M16 10h2a2 2 0 0 1 0 4h-2" stroke={C1} strokeWidth="1.5" fill="none"/><path d="M7 6c1-2 3-2 4 0s3 2 4 0" stroke={C1} strokeWidth="1.5" fill="none" strokeLinecap="round"/><line x1="5" y1="20" x2="16" y2="20" stroke={C1} strokeWidth="1.5" strokeLinecap="round"/></svg>,
  // music
  '🎵': <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="7" cy="17" r="3" fill={C2}/><circle cx="17" cy="15" r="3" fill={C2}/><path d="M10 17V5l10-2v12" stroke={C1} strokeWidth="2" fill="none"/></svg>,
  // book
  '📚': <svg width="22" height="22" viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="16" rx="1" fill={C1} opacity="0.8"/><rect x="9" y="3" width="6" height="16" rx="1" fill={C2}/><rect x="14" y="5" width="6" height="16" rx="1" fill={C1} opacity="0.6"/></svg>,
  // bear
  '🧸': <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="13" r="7" fill={C2}/><circle cx="7" cy="7" r="3" fill={C2}/><circle cx="17" cy="7" r="3" fill={C2}/><circle cx="7" cy="7" r="1.5" fill={C1}/><circle cx="17" cy="7" r="1.5" fill={C1}/><circle cx="10" cy="12" r="1" fill={C1}/><circle cx="14" cy="12" r="1" fill={C1}/><ellipse cx="12" cy="14.5" rx="2" ry="1.5" fill={C1} opacity="0.6"/></svg>,
  // moon
  '🌙': <svg width="22" height="22" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={C2}/><circle cx="17" cy="7" r="1" fill={C1}/><circle cx="19" cy="11" r="0.7" fill={C1} opacity="0.6"/></svg>,
  // tent/circus
  '🎪': <svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 2L3 18h18L12 2z" fill={C2}/><path d="M12 2L8 18" stroke={C1} strokeWidth="1.5"/><path d="M12 2L16 18" stroke={C1} strokeWidth="1.5"/><line x1="5" y1="18" x2="19" y2="18" stroke={C1} strokeWidth="2"/></svg>,
  // wave
  '🌊': <svg width="22" height="22" viewBox="0 0 24 24"><path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" stroke={C1} strokeWidth="2.5" fill="none" strokeLinecap="round"/><path d="M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0" stroke={C2} strokeWidth="2" fill="none" strokeLinecap="round"/></svg>,
  // leaf
  '🍃': <svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 3C6 3 3 8 3 14c3-2 6-3 9-3s6 1 9 3c0-6-3-11-9-11z" fill={C2}/><path d="M12 8v10" stroke={C1} strokeWidth="1.5" strokeLinecap="round"/><path d="M12 12c-2-1-4-1-6 0" stroke={C1} strokeWidth="1" fill="none" strokeLinecap="round"/></svg>,
  // palette
  '🎨': <svg width="22" height="22" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="9" fill={C2} opacity="0.5"/><circle cx="8" cy="9" r="2" fill={C1}/><circle cx="14" cy="8" r="1.5" fill={C1} opacity="0.7"/><circle cx="17" cy="12" r="1.5" fill={C1} opacity="0.5"/><circle cx="8" cy="14" r="1.5" fill={C2}/></svg>,
  // piano
  '🎹': <svg width="22" height="22" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2" fill={C2}/><rect x="6" y="6" width="3" height="7" rx="0.5" fill={C1}/><rect x="11" y="6" width="3" height="7" rx="0.5" fill={C1}/><rect x="16" y="6" width="3" height="7" rx="0.5" fill={C1}/></svg>,
  // house
  '🏠': <svg width="22" height="22" viewBox="0 0 24 24"><path d="M3 12l9-9 9 9" stroke={C1} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/><rect x="5" y="12" width="14" height="9" fill={C2}/><rect x="10" y="15" width="4" height="6" fill={C1} opacity="0.6"/></svg>,
  // sunny
  '🌤️': <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="10" cy="10" r="4" fill={C1} opacity="0.8"/>{[0,60,120,180,240,300].map(a=><line key={a} x1={10+5.5*Math.cos(a*Math.PI/180)} y1={10+5.5*Math.sin(a*Math.PI/180)} x2={10+7*Math.cos(a*Math.PI/180)} y2={10+7*Math.sin(a*Math.PI/180)} stroke={C2} strokeWidth="1.5" strokeLinecap="round"/>)}<path d="M14 16c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4H14z" fill={C2} opacity="0.6"/></svg>,
  // theater
  '🎭': <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="9" cy="10" r="6" fill={C2}/><path d="M7 12c0 1.5 1 3 2 3s2-1.5 2-3" stroke={C1} strokeWidth="1.2" fill="none"/><circle cx="7.5" cy="9" r="0.8" fill={C1}/><circle cx="10.5" cy="9" r="0.8" fill={C1}/><circle cx="16" cy="10" r="6" fill={C1} opacity="0.5"/><path d="M14 13c0-1 1-2 2-2s2 1 2 2" stroke={C2} strokeWidth="1.2" fill="none"/><circle cx="14.5" cy="9" r="0.8" fill={C2}/><circle cx="17.5" cy="9" r="0.8" fill={C2}/></svg>,
  // donut
  '🍩': <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill={C2}/><circle cx="12" cy="12" r="3" fill="white"/><circle cx="9" cy="9" r="1" fill={C1}/><circle cx="15" cy="9" r="1" fill={C1}/><circle cx="14" cy="14" r="1" fill={C1}/></svg>,
  // hibiscus
  '🌺': <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill={C1}/>{[0,72,144,216,288].map(a=><ellipse key={a} cx={12+5*Math.cos(a*Math.PI/180)} cy={12+5*Math.sin(a*Math.PI/180)} rx="3.5" ry="2.5" fill={C2} transform={`rotate(${a+90} ${12+5*Math.cos(a*Math.PI/180)} ${12+5*Math.sin(a*Math.PI/180)})`}/>)}</svg>,
  // phone
  '📱': <svg width="22" height="22" viewBox="0 0 24 24"><rect x="6" y="3" width="12" height="18" rx="2" fill={C2}/><rect x="8" y="5" width="8" height="12" rx="1" fill="white" opacity="0.5"/><circle cx="12" cy="19" r="1" fill={C1}/></svg>,
  // target
  '🎯': <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke={C2} strokeWidth="2.5"/><circle cx="12" cy="12" r="5" fill="none" stroke={C1} strokeWidth="2.5"/><circle cx="12" cy="12" r="2" fill={C1}/></svg>,
  // puzzle
  '🧩': <svg width="22" height="22" viewBox="0 0 24 24"><rect x="4" y="4" width="8" height="8" rx="1.5" fill={C1}/><rect x="12" y="12" width="8" height="8" rx="1.5" fill={C2}/><rect x="12" y="4" width="8" height="8" rx="1.5" fill={C2} opacity="0.6"/><rect x="4" y="12" width="8" height="8" rx="1.5" fill={C1} opacity="0.6"/></svg>,
};

// Fallback: simple magnet icon
const defaultDayIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24">
    <path d="M4 2h4v10a4 4 0 0 0 8 0V2h4v10a8 8 0 0 1-16 0V2z" fill={C2}/>
    <rect x="4" y="2" width="4" height="4" rx="0.5" fill={C1}/>
    <rect x="16" y="2" width="4" height="4" rx="0.5" fill={C1}/>
  </svg>
);

function DayIcon({ emoji }: { emoji: string }) {
  return <span className="weekly-day-icon">{dayIcons[emoji] ?? defaultDayIcon}</span>;
}

/** 자력 게이지 — 반원형 미터 5개 (단일 path + dashoffset) */
function MagneticGauges({ attributes, color }: { attributes: Record<ChemiAttribute, number>; color: string }) {
  const attrs: ChemiAttribute[] = ['talk', 'humor', 'emotion', 'stability', 'passion'];
  const r = 24;
  const strokeW = 5;
  const topPad = strokeW / 2 + 4;    // 상단: 선 두께 + 여백
  const cx_half = r + strokeW / 2 + 3; // 좌우 반폭
  const svgW = cx_half * 2;
  const cx = cx_half;
  const cy = topPad + r;             // 아크 꼭대기가 topPad에 위치
  const botPad = strokeW / 2 + 18;   // 하단: 선 두께 + 피벗 + 넉넉한 여백
  const svgH = cy + botPad;          // 아크 아래 충분한 공간
  const arcLen = Math.PI * r;        // 반원 둘레

  // 공통 path (모든 게이지 동일 — 정렬 보장)
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`;

  return (
    <div className="gauge-container">
      {attrs.map((attr) => {
        const value = attributes[attr] / 100;
        const dashOffset = arcLen * (1 - value);

        // 바늘 각도: 왼쪽(π)에서 value만큼 시계방향
        const needleAngle = Math.PI - Math.PI * value;
        const needleLen = r - 4;
        const needleX = cx + needleLen * Math.cos(needleAngle);
        const needleY = cy - needleLen * Math.sin(needleAngle);

        return (
          <div key={attr} className="gauge-item">
            <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
              {/* Background arc (gray, full) */}
              <path d={arcPath} fill="none" stroke="#CFCFCF" strokeWidth={strokeW} strokeLinecap="round" />
              {/* Fill arc (colored, partial via dashoffset) */}
              <path
                d={arcPath}
                fill="none"
                stroke={color}
                strokeWidth={strokeW}
                strokeLinecap="butt"
                strokeDasharray={arcLen}
                strokeDashoffset={dashOffset}
              />
              {/* Center pivot */}
              <circle cx={cx} cy={cy} r={2} fill="#BBB" />
              {/* Needle */}
              <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#666" strokeWidth={1.5} strokeLinecap="round" />
              <circle cx={needleX} cy={needleY} r={2} fill={color} />
            </svg>
            <span className="gauge-label">{CHEMI_ATTRIBUTE_LABELS[attr]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── 통합 가이드 모달 (자력선 + 게이지) ───
const GUIDE_LEVELS = [
  { level: 5 as const, fill: 0.9, name: '운명의 끌림', gaugeTip: '자석처럼 딱 달라붙는 자기장!', fieldTip: '자력선이 빽빽하고 빠르게 흐르며 파티클이 폭발해!' },
  { level: 4 as const, fill: 0.7, name: '강한 케미', gaugeTip: '충분히 끌리는 자력이야', fieldTip: '많은 자력선이 활발하게 흐르고 있어' },
  { level: 3 as const, fill: 0.5, name: '은근한 설렘', gaugeTip: '은근히 끌리는 느낌', fieldTip: '자력선이 느리게 흐르며 살짝 끌림이 느껴져' },
  { level: 2 as const, fill: 0.3, name: '미지근한 기류', gaugeTip: '아직 자력이 약해', fieldTip: '자력선이 흐릿하고 느리게 흔들려' },
  { level: 1 as const, fill: 0.1, name: '평행선', gaugeTip: '거의 감지 안 됨', fieldTip: '자력선이 거의 없고 정지 상태야' },
];

function ChemiGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  const r = 16;
  const strokeW = 3.5;
  const topPad = strokeW / 2 + 3;
  const cxHalf = r + strokeW / 2 + 2;
  const svgW = cxHalf * 2;
  const cx = cxHalf;
  const cy = topPad + r;
  const botPad = strokeW / 2 + 6;
  const svgH = cy + botPad;
  const arcLen = Math.PI * r;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`;

  return (
    <div className="legend-overlay" onClick={onClose}>
      <div className="legend-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="legend-handle" />
        <p className="legend-title">케미 분석 가이드</p>
        <p className="legend-subtitle">끌림 레벨에 따라 자력선과 게이지가 달라져요</p>
        <div className="guide-level-list">
          {GUIDE_LEVELS.map((item) => {
            const info = ATTRACTION_LEVELS[item.level];
            const dashOffset = arcLen * (1 - item.fill);
            const needleAngle = Math.PI - Math.PI * item.fill;
            const needleLen = r - 3;
            const needleX = cx + needleLen * Math.cos(needleAngle);
            const needleY = cy - needleLen * Math.sin(needleAngle);

            return (
              <div key={item.level} className="guide-level-row">
                <div className="guide-level-header">
                  <span className="guide-level-name" style={{ color: info.color }}>{item.name}</span>
                </div>
                <div className="guide-level-visuals">
                  <div className="guide-field-mini">
                    <MagneticField level={item.level} name1="" name2="" animated={false} />
                  </div>
                  <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
                    <path d={arcPath} fill="none" stroke="#CFCFCF" strokeWidth={strokeW} strokeLinecap="round" />
                    <path d={arcPath} fill="none" stroke={info.color} strokeWidth={strokeW} strokeLinecap="butt"
                      strokeDasharray={arcLen} strokeDashoffset={dashOffset} />
                    <circle cx={cx} cy={cy} r={1.5} fill="#BBB" />
                    <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#666" strokeWidth={1} strokeLinecap="round" />
                    <circle cx={needleX} cy={needleY} r={1.5} fill={info.color} />
                  </svg>
                </div>
                <div className="guide-level-tips">
                  <span className="guide-tip">{item.fieldTip}</span>
                  <span className="guide-tip-sub">{item.gaugeTip}</span>
                </div>
              </div>
            );
          })}
        </div>
        <button className="legend-close-btn" onClick={onClose}>확인</button>
      </div>
    </div>
  );
}

// ─── Info icon SVG ───
const SvgInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BDBDBD" strokeWidth="2" strokeLinecap="round" style={{ verticalAlign: 'middle', cursor: 'pointer' }}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  weeklyForecast,
  weeklyUnlocked,
  onUnlockWeekly,
  onRetry,
  adLoading,
}) => {
  const [guideOpen, setGuideOpen] = useState(false);
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

      {/* Magnetic Field Visualization */}
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
          <img src="/mascot/mascot-main-64.png" alt="끌림이" className="mascot-oneliner-img" />
          <p className="mascot-oneliner-text">{result.oneLiner}</p>
        </div>
      </div>

      {/* Magnetic Gauges — 5속성 자력 게이지 */}
      <div className="result-card card section-gap">
        <p className="result-card-title">
          케미 자력 분석
          <span className="legend-info-btn" onClick={() => setGuideOpen(true)}><SvgInfo /></span>
        </p>
        <MagneticGauges attributes={result.attributes} color={result.level.color} />
        <div className="gauge-summary">
          <span className="gauge-summary-item gauge-strong">
            <SvgArrowUp color={result.level.color} />
            {CHEMI_ATTRIBUTE_LABELS[strongest.attr]}{hasJongseong(CHEMI_ATTRIBUTE_LABELS[strongest.attr]) ? '이' : '가'} 가장 강해!
          </span>
          <span className="gauge-summary-item gauge-weak">
            <SvgArrowDown color="#BDBDBD" />
            {CHEMI_ATTRIBUTE_LABELS[weakest.attr]}{hasJongseong(CHEMI_ATTRIBUTE_LABELS[weakest.attr]) ? '은' : '는'} 좀 더 키워봐~
          </span>
        </div>
      </div>

      {/* Date Scenario */}
      <div className="result-card card section-gap">
        <p className="result-card-title">이런 데이트 어때?</p>
        <p className="result-card-content scenario-text">
          {result.dateScenario}
        </p>
      </div>

      {/* Mascot Speech Bubble */}
      <div className="mascot-advice-section section-gap">
        <div className="mascot-advice-bubble">
          <img
            src={result.level.level >= 3 ? '/mascot/mascot-happy-64.png' : result.level.level >= 2 ? '/mascot/mascot-thinking-64.png' : '/mascot/mascot-sad-64.png'}
            alt="끌림이"
            className="mascot-advice-img"
          />
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
                    <DayIcon emoji={f.emojiPair[0]} />
                    <p className="weekly-day-msg">{f.message}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="premium-locked">
              <SvgLock />
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
          <SvgRefresh /> 다른 이름으로 측정하기
        </button>
      </div>

      {/* Guide Modal */}
      <ChemiGuide open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  );
};

export default ResultScreen;
