import React from 'react';
import { X, Clock, Navigation, Compass, MapPin, ArrowRight, Gauge } from 'lucide-react';
import { TrainLive } from '../types/train';

interface TrainDetailsPanelProps {
  train: TrainLive | null;
  onClose: () => void;
}

export const TrainDetailsPanel: React.FC<TrainDetailsPanelProps> = ({ train, onClose }) => {
  if (!train) return null;

  const isDelayed = train.delay_minutes > 0;
  const isPremium = ['Rajdhani', 'Shatabdi', 'Vande Bharat', 'Duronto'].includes(train.train_type);
  const percentCovered = train.total_distance_km > 0
    ? Math.min(100, Math.round((train.distance_covered_km / train.total_distance_km) * 100))
    : 45;

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

      {/* Status Pill */}
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

      {/* DEPARTURE & ARRIVAL STATIONS CARD (PRD Req 6) */}
      <div className="journey-endpoints-card">
        {/* Origin */}
        <div className="endpoint-column">
          <span className="endpoint-label">DEPARTURE STATION</span>
          <span className="endpoint-code">{train.from_station_code}</span>
          <span className="endpoint-name">{train.from_station_name}</span>
          <span className="endpoint-time">DEP: {train.departure_time || '08:00'}</span>
        </div>

        <div className="endpoint-arrow-center">
          <ArrowRight size={18} className="route-arrow-icon" />
          {train.duration_h && (
            <span className="duration-pill">{train.duration_h}h {train.duration_m || 0}m</span>
          )}
        </div>

        {/* Destination */}
        <div className="endpoint-column text-right">
          <span className="endpoint-label">ARRIVAL STATION</span>
          <span className="endpoint-code">{train.to_station_code}</span>
          <span className="endpoint-name">{train.to_station_name}</span>
          <span className="endpoint-time">ARR: {train.arrival_time || '22:30'}</span>
        </div>
      </div>

      {/* Journey Progress Bar */}
      <div className="journey-progress-container">
        <div className="progress-header">
          <span className="progress-label">TRACK PROGRESS</span>
          <span className="progress-percent">{percentCovered}%</span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${percentCovered}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* Distance Card */}
        <div className="stat-card">
          <div className="stat-label">
            <Navigation size={13} className="stat-label-icon" />
            <span>DISTANCE</span>
          </div>
          <div className="stat-value-group">
            <span className="stat-mono-val">{train.distance_covered_km}</span>
            <span className="stat-unit">/ {train.total_distance_km} KM</span>
          </div>
        </div>

        {/* Schedule Card */}
        <div className={`stat-card ${isDelayed ? 'highlight-warning' : 'highlight-success'}`}>
          <div className="stat-label">
            <Clock size={13} className="stat-label-icon" />
            <span>PUNCTUALITY</span>
          </div>
          <div className="stat-value-group">
            <span className="stat-mono-val">
              {train.delay_minutes === 0 ? 'ON TIME' : `+${train.delay_minutes}M`}
            </span>
            <span className="stat-unit">{train.delay_minutes > 0 ? 'DELAY' : 'EXACT'}</span>
          </div>
        </div>

        {/* Approaching Station */}
        <div className="stat-card full-width">
          <div className="stat-label">
            <MapPin size={13} className="stat-label-icon" />
            <span>APPROACHING HALT / NEXT STATION</span>
          </div>
          <div className="next-station-content">
            <span className="station-code">{train.next_station_code || train.to_station_code}</span>
            <span className="station-name">{train.next_station_name || train.to_station_name}</span>
          </div>
        </div>

        {/* Heading & Telemetry */}
        <div className="stat-card">
          <div className="stat-label">
            <Compass size={13} className="stat-label-icon" />
            <span>HEADING</span>
          </div>
          <div className="stat-value-group">
            <span className="stat-mono-val">{train.bearing_degrees}°</span>
            <span className="stat-unit">TRACK</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            <Gauge size={13} className="stat-label-icon" />
            <span>TELEMETRY</span>
          </div>
          <div className="stat-value-group">
            <span className="stat-mono-val">GPS</span>
            <span className="stat-unit">LOCKED</span>
          </div>
        </div>
      </div>

      {/* Map Legend (PRD Req 4, 5, 7) */}
      <div className="route-legend-box">
        <span className="legend-title">MAP VISUAL LEGEND</span>
        <div className="legend-grid">
          <div className="legend-item">
            <span className="legend-line red-dashed"></span>
            <span className="legend-text">Railway Track Network</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot green-dot"></span>
            <span className="legend-text">Railway Station</span>
          </div>
          <div className="legend-item">
            <span className="legend-head orange-loco"></span>
            <span className="legend-text">Train Head (Orange)</span>
          </div>
          <div className="legend-item">
            <span className="legend-line blue-solid"></span>
            <span className="legend-text">Traveled Route (Blue)</span>
          </div>
        </div>
      </div>

      {/* Coordinates Meta */}
      <div className="panel-footer-meta">
        <span>LAT: {train.current_lat.toFixed(4)}°N</span>
        <span>LNG: {train.current_lng.toFixed(4)}°E</span>
      </div>
    </aside>
  );
};
