import React, { useState, useRef, useEffect } from 'react';

interface RecentSearch {
  name1: string;
  name2: string;
  timestamp: number;
}

interface InputScreenProps {
  onCalculate: (name1: string, name2: string) => void;
  recentSearches: RecentSearch[];
}

const InputScreen: React.FC<InputScreenProps> = ({ onCalculate, recentSearches }) => {
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');
  const name1Ref = useRef<HTMLInputElement>(null);
  const name2Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    name1Ref.current?.focus();
  }, []);

  const isValid = name1.trim().length >= 2 && name2.trim().length >= 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onCalculate(name1.trim(), name2.trim());
  };

  const handleRecentClick = (search: RecentSearch) => {
    setName1(search.name1);
    setName2(search.name2);
    onCalculate(search.name1, search.name2);
  };

  return (
    <div className="phase-input">
      {/* Header */}
      <div className="input-header">
        <div className="input-mascot-wrap">
          <img src="/mascot/mascot-main.png" alt="끌림이" className="input-mascot-img" />
        </div>
        <h1>우리 케미</h1>
        <p>두 이름 사이의 끌림을 측정해볼까?</p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="input-form">
        <div className="input-group">
          <label className="input-label" htmlFor="name1">
            첫 번째 이름
          </label>
          <div className="input-field-wrapper">
            <input
              ref={name1Ref}
              id="name1"
              type="text"
              className="input-field"
              placeholder="이름을 입력해줘"
              value={name1}
              onChange={(e) => setName1(e.target.value)}
              maxLength={10}
              autoComplete="off"
            />
            <span className="input-field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M12 14s-1.5 2-1.5 3a1.5 1.5 0 0 0 3 0c0-1-1.5-3-1.5-3z" fill="currentColor" stroke="none"/></svg>
            </span>
          </div>
        </div>

        <div className="input-versus">
          <svg className="versus-magnet-svg" width="20" height="20" viewBox="0 0 24 24"><path d="M4 2h4v10a4 4 0 0 0 8 0V2h4v10a8 8 0 0 1-16 0V2z" fill="currentColor" opacity="0.6"/><rect x="4" y="2" width="4" height="4" rx="0.5" fill="#FF1744"/><rect x="16" y="2" width="4" height="4" rx="0.5" fill="#2196F3"/></svg>
          <span className="versus-line" />
          <svg className="versus-magnet-svg" width="20" height="20" viewBox="0 0 24 24"><path d="M4 2h4v10a4 4 0 0 0 8 0V2h4v10a8 8 0 0 1-16 0V2z" fill="currentColor" opacity="0.6"/><rect x="4" y="2" width="4" height="4" rx="0.5" fill="#FF1744"/><rect x="16" y="2" width="4" height="4" rx="0.5" fill="#2196F3"/></svg>
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="name2">
            두 번째 이름
          </label>
          <div className="input-field-wrapper">
            <input
              ref={name2Ref}
              id="name2"
              type="text"
              className="input-field"
              placeholder="이름을 입력해줘"
              value={name2}
              onChange={(e) => setName2(e.target.value)}
              maxLength={10}
              autoComplete="off"
            />
            <span className="input-field-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M12 14s-1.5 2-1.5 3a1.5 1.5 0 0 0 3 0c0-1-1.5-3-1.5-3z" fill="currentColor" stroke="none"/></svg>
            </span>
          </div>
        </div>

        <button
          type="submit"
          className={`btn-primary ${isValid ? 'ready' : ''}`}
          disabled={!isValid}
        >
          {isValid ? '끌림 측정하기' : '두 이름을 입력해줘'}
        </button>
      </form>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="recent-section">
          <p className="recent-title">최근 측정</p>
          <div className="recent-list">
            {recentSearches.map((s, i) => (
              <button
                key={`${s.name1}-${s.name2}-${i}`}
                className="recent-chip"
                onClick={() => handleRecentClick(s)}
              >
                <svg className="recent-chip-icon" width="14" height="14" viewBox="0 0 24 24"><path d="M4 2h4v10a4 4 0 0 0 8 0V2h4v10a8 8 0 0 1-16 0V2z" fill="currentColor" opacity="0.5"/><rect x="4" y="2" width="4" height="4" rx="0.5" fill="#FF1744"/><rect x="16" y="2" width="4" height="4" rx="0.5" fill="#2196F3"/></svg>
                <span>{s.name1} × {s.name2}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer hint */}
      <p className="input-footer-hint">
        끌림이가 두 이름의 자력을 분석해줄게!
      </p>
    </div>
  );
};

export default InputScreen;
