// ─── 케미 속성 ───
export type ChemiAttribute = 'talk' | 'humor' | 'emotion' | 'stability' | 'passion';

export const CHEMI_ATTRIBUTE_LABELS: Record<ChemiAttribute, string> = {
  talk: '대화력',
  humor: '유머',
  emotion: '감성',
  stability: '안정감',
  passion: '열정',
};

// ─── 끌림 레벨 (점수 대체) ───
export type AttractionLevel = 1 | 2 | 3 | 4 | 5;

export interface AttractionLevelInfo {
  level: AttractionLevel;
  name: string;
  color: string;
  description: string;
}

export const ATTRACTION_LEVELS: Record<AttractionLevel, AttractionLevelInfo> = {
  5: { level: 5, name: '운명의 끌림', color: '#FF1744', description: '자석처럼 떨어질 수 없는' },
  4: { level: 4, name: '강한 케미', color: '#FF7043', description: '만나면 불꽃이 튀는' },
  3: { level: 3, name: '은근한 설렘', color: '#FFA726', description: '자꾸 신경 쓰이는' },
  2: { level: 2, name: '미지근한 기류', color: '#BDBDBD', description: '아직은 서먹한' },
  1: { level: 1, name: '평행선', color: '#90A4AE', description: '각자의 길을 걷는' },
};

// ─── 케미 결과 ───
export interface ChemiResult {
  /** 두 이름 (정렬됨) */
  names: [string, string];
  /** 원본 입력 순서 */
  originalNames: [string, string];
  /** 총 끌림 레벨 */
  level: AttractionLevelInfo;
  /** 5개 속성 점수 (내부값 0-100, UI에 숫자 노출 금지) */
  attributes: Record<ChemiAttribute, number>;
  /** 5개 속성 각각의 끌림 레벨 */
  attributeLevels: Record<ChemiAttribute, AttractionLevelInfo>;
  /** 대표 이모지 쌍 */
  emojiPair: [string, string];
  /** 케미 한줄평 */
  oneLiner: string;
  /** 데이트 시나리오 (5개 속성 통합 1문장) */
  dateScenario: string;
  /** 계산 날짜 (YYYY-MM-DD) */
  date: string;
}

// ─── 주간 케미 전망 (프리미엄) ───
export interface WeeklyForecast {
  day: string;
  label: string;
  emojiPair: [string, string];
  message: string;
}

export interface WeeklyChemiForecast {
  names: [string, string];
  weekStart: string;
  forecasts: WeeklyForecast[];
}
