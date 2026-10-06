import React from 'react';
import { Search, X, Radio } from 'lucide-react';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalTrainsCount: number;
  filteredCount: number;
  isRealtimeActive: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  searchQuery,
  onSearchChange,
  totalTrainsCount,
  filteredCount,
  isRealtimeActive,
}) => {
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

        <div className="search-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search trains by number or name (e.g. 12951, Rajdhani, Mumbai, Srinagar)..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="status-indicator-pill">
          <span className={`live-dot ${isRealtimeActive ? 'active' : ''}`} />
          <span className="live-label">
            {isRealtimeActive ? 'LIVE REALTIME' : 'POLLING'}
          </span>
          <span className="live-count">
            {filteredCount} / {totalTrainsCount}
          </span>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
