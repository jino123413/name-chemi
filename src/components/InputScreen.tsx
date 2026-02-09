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
          <span className="input-mascot-emoji">🧲</span>
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
              <i className="ri-user-heart-line" />
            </span>
          </div>
        </div>

        <div className="input-versus">
          <span className="versus-magnet">🧲</span>
          <span className="versus-line" />
          <span className="versus-magnet">🧲</span>
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
              <i className="ri-user-heart-line" />
            </span>
          </div>
        </div>

        <button
          type="submit"
          className={`btn-primary ${isValid ? 'ready' : ''}`}
          disabled={!isValid}
        >
          {isValid ? '끌림 측정하기 🧲' : '두 이름을 입력해줘'}
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
                <span className="recent-chip-icon">🧲</span>
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
