import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { ChemiResult, WeeklyChemiForecast } from './types';
import { calculateChemi, calculateWeeklyForecast } from './utils/chemi-engine';
import { useInterstitialAd } from './hooks/useInterstitialAd';
import InputScreen from './components/InputScreen';
import RevealScreen from './components/RevealScreen';
import ResultScreen from './components/ResultScreen';

type Phase = 'input' | 'reveal' | 'result';

const STORAGE_KEY = 'name-chemi-recent';

interface RecentSearch {
  name1: string;
  name2: string;
  timestamp: number;
}

async function loadRecent(): Promise<RecentSearch[]> {
  try {
    const { Storage } = await import('@apps-in-toss/web-framework');
    const raw = await Storage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

async function saveRecent(name1: string, name2: string) {
  try {
    const { Storage } = await import('@apps-in-toss/web-framework');
    const list = await loadRecent();
    const filtered = list.filter(
      (r) => !(r.name1 === name1 && r.name2 === name2),
    );
    filtered.unshift({ name1, name2, timestamp: Date.now() });
    const trimmed = filtered.slice(0, 5);
    await Storage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

const App: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('input');
  const [result, setResult] = useState<ChemiResult | null>(null);
  const [weeklyForecast, setWeeklyForecast] = useState<WeeklyChemiForecast | null>(null);
  const [weeklyUnlocked, setWeeklyUnlocked] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const { loading: adLoading, showInterstitialAd } = useInterstitialAd();
  const revealTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    loadRecent().then(setRecentSearches);
  }, []);

  const handleCalculate = useCallback((name1: string, name2: string) => {
    const chemiResult = calculateChemi(name1, name2);
    setResult(chemiResult);

    saveRecent(name1, name2);
    loadRecent().then(setRecentSearches);

    // Weekly forecast (prepared for premium)
    const forecast = calculateWeeklyForecast(name1, name2);
    setWeeklyForecast(forecast);

    try {
      generateHapticFeedback({ type: 'softMedium' });
    } catch {}

    // Reveal phase
    setPhase('reveal');

    revealTimerRef.current = setTimeout(() => {
      try {
        generateHapticFeedback({ type: 'rigid' });
      } catch {}
      setPhase('result');
    }, 2800);
  }, []);

  const handleUnlockWeekly = useCallback(() => {
    showInterstitialAd({
      onDismiss: () => {
        setWeeklyUnlocked(true);
        try {
          generateHapticFeedback({ type: 'softMedium' });
        } catch {}
      },
    });
  }, [showInterstitialAd]);

  const handleRetry = useCallback(() => {
    setPhase('input');
    setResult(null);
    setWeeklyUnlocked(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    return () => {
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
  }, []);

  return (
    <div className="app-container">
      {phase === 'input' && (
        <InputScreen
          onCalculate={handleCalculate}
          recentSearches={recentSearches}
        />
      )}

      {phase === 'reveal' && result && (
        <RevealScreen result={result} />
      )}

      {phase === 'result' && result && (
        <ResultScreen
          result={result}
          weeklyForecast={weeklyForecast}
          weeklyUnlocked={weeklyUnlocked}
          onUnlockWeekly={handleUnlockWeekly}
          onRetry={handleRetry}
          adLoading={adLoading}
        />
      )}
    </div>
  );
};

export default App;
