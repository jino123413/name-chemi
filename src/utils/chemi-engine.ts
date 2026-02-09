import { format, startOfWeek, addDays } from 'date-fns';
import type {
  AttractionLevel,
  AttractionLevelInfo,
  ChemiAttribute,
  ChemiResult,
  WeeklyChemiForecast,
  WeeklyForecast,
} from '../types';
import { ATTRACTION_LEVELS } from '../types';
import {
  ONE_LINERS,
  EMOJI_PAIRS,
  DATE_SCENARIOS,
  WEEKLY_MESSAGE_POOL,
  WEEKLY_EMOJI_POOL,
  DAY_LABELS,
} from '../data/chemi-data';

// ─── 해시 함수 (결정론적) ───
// djb2 변형 — 간단하면서도 분포 균일
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0; // unsigned 32-bit
}

// 해시에서 0~max 범위 정수 추출 (seed 역할의 offset 지원)
function hashToRange(hash: number, max: number, offset: number = 0): number {
  // offset을 섞어서 다른 속성마다 다른 값 생성
  const mixed = hashString(`${hash}:${offset}`);
  return mixed % (max + 1);
}

// ─── 이름 정규화 ───
function normalizeNames(nameA: string, nameB: string): [string, string] {
  const a = nameA.trim();
  const b = nameB.trim();
  // 정렬해서 순서 무관하게 동일한 결과
  return a.localeCompare(b, 'ko') <= 0 ? [a, b] : [b, a];
}

// ─── 점수 → 끌림 레벨 변환 ───
function scoreToLevel(score: number): AttractionLevel {
  if (score >= 85) return 5;
  if (score >= 70) return 4;
  if (score >= 50) return 3;
  if (score >= 30) return 2;
  return 1;
}

function getLevelInfo(score: number): AttractionLevelInfo {
  return ATTRACTION_LEVELS[scoreToLevel(score)];
}

// ─── 오늘 날짜 키 ───
function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

// ─── 케미 계산 메인 함수 ───
export function calculateChemi(
  nameA: string,
  nameB: string,
  dateKey?: string,
): ChemiResult {
  const date = dateKey ?? todayKey();
  const [sortedA, sortedB] = normalizeNames(nameA, nameB);
  const seed = `${sortedA}+${sortedB}@${date}`;
  const baseHash = hashString(seed);

  // 총점 (0-100)
  const totalScore = hashToRange(baseHash, 100, 0);

  // 5개 속성 점수 — 속성명으로 독립 해시 (총점과 50:50 블렌드)
  const ATTRIBUTES: ChemiAttribute[] = ['talk', 'humor', 'emotion', 'stability', 'passion'];
  const attributes = {} as Record<ChemiAttribute, number>;
  const attributeLevels = {} as Record<ChemiAttribute, AttractionLevelInfo>;

  ATTRIBUTES.forEach((attr) => {
    // 속성명을 시드에 포함하여 완전히 독립된 해시 생성
    const attrHash = hashString(`${seed}:attr:${attr}`);
    const independent = attrHash % 101; // 0~100 독립 점수
    // 총점과 블렌드: 레벨 상관성 유지 + 충분한 분산
    const blended = Math.round(totalScore * 0.4 + independent * 0.6);
    const score = Math.max(10, Math.min(95, blended));
    attributes[attr] = score;
    attributeLevels[attr] = getLevelInfo(score);
  });

  // 끌림 레벨
  const level = getLevelInfo(totalScore);
  const lvl = level.level;

  // 이모지 쌍 선택
  const emojiIdx = hashToRange(baseHash, EMOJI_PAIRS[lvl].length - 1, 10);
  const emojiPair = EMOJI_PAIRS[lvl][emojiIdx];

  // 한줄평 선택
  const oneLinerIdx = hashToRange(baseHash, ONE_LINERS[lvl].length - 1, 20);
  const oneLiner = ONE_LINERS[lvl][oneLinerIdx];

  // 데이트 시나리오 선택
  const scenarioIdx = hashToRange(baseHash, DATE_SCENARIOS[lvl].length - 1, 30);
  const dateScenario = DATE_SCENARIOS[lvl][scenarioIdx];

  // 원본 순서 보존
  const originalA = nameA.trim();
  const originalB = nameB.trim();

  return {
    names: [sortedA, sortedB],
    originalNames: [originalA, originalB],
    level,
    attributes,
    attributeLevels,
    emojiPair,
    oneLiner,
    dateScenario,
    date,
  };
}

// ─── 주간 케미 전망 ───
export function calculateWeeklyForecast(
  nameA: string,
  nameB: string,
): WeeklyChemiForecast {
  const [sortedA, sortedB] = normalizeNames(nameA, nameB);
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // 월요일 시작
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  const forecasts: WeeklyForecast[] = DAY_LABELS.map((label, i) => {
    const dayDate = addDays(weekStart, i);
    const dayKey = format(dayDate, 'yyyy-MM-dd');
    const seed = `weekly:${sortedA}+${sortedB}@${dayKey}`;
    const hash = hashString(seed);

    const msgIdx = hashToRange(hash, WEEKLY_MESSAGE_POOL.length - 1, 0);
    const emojiIdx = hashToRange(hash, WEEKLY_EMOJI_POOL.length - 1, 1);

    return {
      day: dayKey,
      label,
      emojiPair: WEEKLY_EMOJI_POOL[emojiIdx],
      message: WEEKLY_MESSAGE_POOL[msgIdx],
    };
  });

  return {
    names: [sortedA, sortedB],
    weekStart: weekStartStr,
    forecasts,
  };
}

// ─── 유틸리티: 속성 중 가장 높은/낮은 것 ───
export function getStrongestAttribute(
  attributes: Record<ChemiAttribute, number>,
): { attr: ChemiAttribute; score: number } {
  const entries = Object.entries(attributes) as [ChemiAttribute, number][];
  return entries.reduce((best, [attr, score]) =>
    score > best.score ? { attr, score } : best,
    { attr: 'talk' as ChemiAttribute, score: -1 },
  );
}

export function getWeakestAttribute(
  attributes: Record<ChemiAttribute, number>,
): { attr: ChemiAttribute; score: number } {
  const entries = Object.entries(attributes) as [ChemiAttribute, number][];
  return entries.reduce((worst, [attr, score]) =>
    score < worst.score ? { attr, score } : worst,
    { attr: 'talk' as ChemiAttribute, score: 101 },
  );
}
