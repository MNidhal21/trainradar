import React from 'react';
import { X, Clock, Navigation, Compass, MapPin, Gauge } from 'lucide-react';
import { TrainLive } from '../types/train';

interface TrainDetailsPanelProps {
  train: TrainLive | null;
  onClose: () => void;
}

export const TrainDetailsPanel: React.FC<TrainDetailsPanelProps> = ({ train, onClose }) => {
  if (!train) return null;

  const isDelayed = train.delay_minutes > 0;
  const isPremium = ['Rajdhani', 'Shatabdi', 'Vande Bharat'].includes(train.train_type);
  const percentCovered = train.total_distance_km > 0
    ? Math.min(100, Math.round((train.distance_covered_km / train.total_distance_km) * 100))
    : 0;

  return (
    <aside className="train-details-panel">
      {/* Header */}
      <div className="panel-header">
        <div className="panel-title-area">
          <div className="panel-badges">
            <span className={`type-badge ${isPremium ? 'premium' : ''}`}>
              {train.train_type.toUpperCase()}
            </span>
            <span className="train-number-tag">#{train.train_number}</span>
          </div>
          <h2 className="train-name">{train.train_name}</h2>
        </div>
        <button
          className="panel-close-btn"
          onClick={onClose}
          aria-label="Close panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Status Pill (PRD Section 10 Component) */}
      <div className="status-pill-section">
        <div className={`status-pill ${train.status.toLowerCase()} ${isDelayed ? 'delayed' : ''}`}>
          <span className="status-dot" />
          <span className="status-text">
            {train.status === 'RUNNING' && !isDelayed && 'RUNNING ON TIME'}
            {train.status === 'RUNNING' && isDelayed && `RUNNING (+${train.delay_minutes}M)`}
            {train.status === 'DELAYED' && `DELAYED BY ${train.delay_minutes} MIN`}
            {train.status === 'ARRIVED' && 'ARRIVED AT DESTINATION'}
          </span>
        </div>
      </div>

      {/* Journey Progress Bar */}
      <div className="journey-progress-container">
        <div className="progress-header">
          <span className="progress-label">JOURNEY COMPLETION</span>
          <span className="progress-percent">{percentCovered}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${percentCovered}%` }}
          />
        </div>
      </div>

      {/* Glass Stat Cards Grid (PRD Section 10) */}
      <div className="stats-grid">
        {/* Distance Card */}
        <div className="stat-card">
          <div className="stat-label">
            <Navigation size={13} className="stat-label-icon" />
            <span>DISTANCE COVERED</span>
          </div>
          <div className="stat-value-group">
            <span className="stat-mono-val">{train.distance_covered_km}</span>
            <span className="stat-unit">/ {train.total_distance_km} KM</span>
          </div>
        </div>

        {/* Delay Card */}
        <div className={`stat-card ${isDelayed ? 'highlight-warning' : 'highlight-success'}`}>
          <div className="stat-label">
            <Clock size={13} className="stat-label-icon" />
            <span>SCHEDULE STATUS</span>
          </div>
          <div className="stat-value-group">
            <span className="stat-mono-val">
              {train.delay_minutes === 0 ? 'ON TIME' : `+${train.delay_minutes}M`}
            </span>
            <span className="stat-unit">{train.delay_minutes > 0 ? 'DELAY' : 'ACCURATE'}</span>
          </div>
        </div>

        {/* Next Halt Card */}
        <div className="stat-card full-width">
          <div className="stat-label">
            <MapPin size={13} className="stat-label-icon" />
            <span>APPROACHING STATION</span>
          </div>
          <div className="next-station-content">
            <span className="station-code">{train.next_station_code || '---'}</span>
            <span className="station-name">{train.next_station_name || 'In Transit'}</span>
          </div>
        </div>

        {/* Bearing & Telemetry Info */}
        <div className="stat-card">
          <div className="stat-label">
            <Compass size={13} className="stat-label-icon" />
            <span>HEADING</span>
          </div>
          <div className="stat-value-group">
            <span className="stat-mono-val">{train.bearing_degrees}\u00B0</span>
            <span className="stat-unit">BEARING</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <Gauge size={13} className="stat-label-icon" />
            <span>LIVE TELEMETRY</span>
          </div>
          <div className="stat-value-group">
            <span className="stat-mono-val">GPS</span>
            <span className="stat-unit">ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Route Legend (Traveled Amber vs Remaining Light Blue) */}
      <div className="route-legend-box">
        <span className="legend-title">MAP ROUTE GUIDE</span>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-line amber-dashed"></span>
            <span className="legend-text">Traveled Route</span>
          </div>
          <div className="legend-item">
            <span className="legend-line blue-solid"></span>
            <span className="legend-text">Projected Route</span>
          </div>
        </div>
      </div>

      {/* Coordinates / Meta footer */}
      <div className="panel-footer-meta">
        <span>LAT: {train.current_lat.toFixed(4)}\u00B0N</span>
        <span>LNG: {train.current_lng.toFixed(4)}\u00B0E</span>
      </div>
    </aside>
  );
};
