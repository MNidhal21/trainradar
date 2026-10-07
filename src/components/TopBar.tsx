import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Radio, ArrowRight } from 'lucide-react';
import { TrainLive } from '../types/train';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isRealtimeActive: boolean;
  matchingTrains: TrainLive[];
  onSelectTrain: (train: TrainLive) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  isRealtimeActive,
  matchingTrains,
  onSelectTrain,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const topMatches = matchingTrains.slice(0, 6);

  return (
    <header className="top-bar-container">
      <div className="top-bar-inner">
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <div className="brand-pulse"></div>
            <Radio className="brand-icon" size={18} />
          </div>
          <div className="brand-text">
            <h1 className="brand-title">TrainRadar</h1>
            <span className="brand-subtitle">Live Indian Railways</span>
          </div>
        </div>

        <div className="search-wrapper" ref={searchWrapperRef}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search trains by number or name (e.g. 12951, Rajdhani)..."
            value={searchQuery}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => {
              onSearchChange(e.target.value);
              setShowDropdown(true);
            }}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => {
                onSearchChange('');
                setShowDropdown(false);
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}

          {/* Interactive Search Autocomplete Dropdown */}
          {showDropdown && searchQuery.trim().length > 0 && (
            <div className="search-results-dropdown">
              {topMatches.length > 0 ? (
                topMatches.map((t) => (
                  <div
                    key={t.train_number}
                    className="search-result-item"
                    onClick={() => {
                      onSelectTrain(t);
                      setShowDropdown(false);
                      onSearchChange('');
                    }}
                  >
                    <div className="result-item-main">
                      <div className="result-item-title">
                        <span className="result-train-num">#{t.train_number}</span>
                        <span className="result-train-name">{t.train_name}</span>
                      </div>
                      <div className="result-item-route">
                        <span>{t.from_station_code || t.from_station_name}</span>
                        <ArrowRight size={12} className="route-arrow-tiny" />
                        <span>{t.to_station_code || t.to_station_name}</span>
                      </div>
                    </div>
                    <span className={`result-status-tag ${t.status.toLowerCase()}`}>
                      {t.status === 'RUNNING' ? 'RUNNING' : `+${t.delay_minutes}m`}
                    </span>
                  </div>
                ))
              ) : (
                <div className="search-no-results">
                  No trains found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        <div className="status-indicator-pill">
          <span className={`live-dot ${isRealtimeActive ? 'active' : ''}`} />
          <span className="live-label">
            {isRealtimeActive ? 'LIVE REALTIME' : 'POLLING'}
          </span>
          
        </div>
      </div>
    </header>
  );
};

export default TopBar;



