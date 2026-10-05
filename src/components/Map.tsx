import React, { useEffect, useRef } from 'react';
import maplibregl, { Map as MapLibreMap, Marker, Popup } from 'maplibre-gl';
import { TrainLive, TrainRouteGeoJSON } from '../types/train';
import { DARK_MAP_STYLE_URL } from '../lib/mapStyle';

interface MapProps {
  trains: TrainLive[];
  selectedTrain: TrainLive | null;
  selectedRoute: TrainRouteGeoJSON | null;
  onSelectTrain: (train: TrainLive) => void;
}

export const Map: React.FC<MapProps> = ({
  trains,
  selectedTrain,
  selectedRoute,
  onSelectTrain,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Record<string, { marker: Marker; el: HTMLElement; lat: number; lng: number }>>({});

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: DARK_MAP_STYLE_URL,
      center: [78.9629, 22.5937],
      zoom: 4.8,
      minZoom: 3.5,
      maxZoom: 15,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
      'top-right'
    );

    map.on('load', () => {
      // 1. ADD ALL INDIAN RAILWAY TRACKS (Red Dotted Lines - PRD Req 4)
      if (!map.getSource('railway-tracks')) {
        map.addSource('railway-tracks', {
          type: 'geojson',
          data: './data/railway_tracks.json',
        });

        // Red soft glow under tracks
        map.addLayer({
          id: 'railway-tracks-glow',
          type: 'line',
          source: 'railway-tracks',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#ef4444',
            'line-width': 3.5,
            'line-opacity': 0.25,
            'line-blur': 2,
            'line-dasharray': [2, 2.5],
          },
        });

        // Red dotted railway track lines
        map.addLayer({
          id: 'railway-tracks-dotted',
          type: 'line',
          source: 'railway-tracks',
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#ef4444',
            'line-width': 1.6,
            'line-opacity': 0.85,
            'line-dasharray': [2, 2.5],
          },
        });
      }

      // 2. ADD ALL INDIAN RAILWAY STATIONS (Green Dots - PRD Req 7)
      if (!map.getSource('railway-stations')) {
        map.addSource('railway-stations', {
          type: 'geojson',
          data: './data/railway_stations.json',
        });

        // Green Station Glow
        map.addLayer({
          id: 'railway-stations-glow',
          type: 'circle',
          source: 'railway-stations',
          minzoom: 5.2,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 5.2, 3, 9, 6.5],
            'circle-color': '#10b981',
            'circle-opacity': 0.4,
            'circle-blur': 1,
          },
        });

        // Green Station Circle Dot
        map.addLayer({
          id: 'railway-stations-dot',
          type: 'circle',
          source: 'railway-stations',
          minzoom: 5.2,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 5.2, 1.8, 9, 4],
            'circle-color': '#22c55e',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#064e3b',
          },
        });

        // Station Code & Name Labels on higher zoom
        map.addLayer({
          id: 'railway-stations-label',
          type: 'symbol',
          source: 'railway-stations',
          minzoom: 8.5,
          layout: {
            'text-field': ['concat', ['get', 'name'], ' (', ['get', 'code'], ')'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 10,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
          },
          paint: {
            'text-color': '#4ade80',
            'text-halo-color': '#062d22',
            'text-halo-width': 2,
          },
        });

        // Interactive Station Popups
        map.on('mouseenter', 'railway-stations-dot', () => {
          map.getCanvas().style.cursor = 'pointer';
        });
        map.on('mouseleave', 'railway-stations-dot', () => {
          map.getCanvas().style.cursor = '';
        });

        map.on('click', 'railway-stations-dot', (e) => {
          const feat = e.features?.[0];
          if (!feat) return;
          const props = feat.properties as any;
          const geom = feat.geometry as any;
          new Popup({ closeButton: true, className: 'station-popup' })
            .setLngLat(geom.coordinates)
            .setHTML(`
              <div class="station-popup-content">
                <span class="station-popup-code">${props.code}</span>
                <span class="station-popup-name">${props.name}</span>
                <span class="station-popup-state">${props.state || ''} ${props.zone ? '� Zone: ' + props.zone : ''}</span>
              </div>
            `)
            .addTo(map);
        });
      }

      // 3. SELECTED TRAIN ROUTE (Blue Traveled Route - PRD Req 5)
      if (!map.getSource('selected-train-route')) {
        map.addSource('selected-train-route', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });

        // Traveled Route Glow (Neon Blue)
        map.addLayer({
          id: 'route-traveled-glow',
          type: 'line',
          source: 'selected-train-route',
          filter: ['==', ['get', 'segment'], 'traveled'],
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#38bdf8',
            'line-width': 10,
            'line-opacity': 0.45,
            'line-blur': 5,
          },
        });

        // Traveled Route Solid Line (Vibrant Blue - PRD Req 5)
        map.addLayer({
          id: 'route-traveled-line',
          type: 'line',
          source: 'selected-train-route',
          filter: ['==', ['get', 'segment'], 'traveled'],
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#0284c7',
            'line-width': 4.5,
          },
        });

        // Remaining Route Projected Line (Subtle Cyan dashed)
        map.addLayer({
          id: 'route-remaining-line',
          type: 'line',
          source: 'selected-train-route',
          filter: ['==', ['get', 'segment'], 'remaining'],
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#7dd3fc',
            'line-width': 2.5,
            'line-dasharray': [2, 2],
            'line-opacity': 0.7,
          },
        });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Route Layers when selectedRoute changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('selected-train-route') as maplibregl.GeoJSONSource;
    if (source) {
      if (selectedRoute) {
        source.setData(selectedRoute as any);
      } else {
        source.setData({
          type: 'FeatureCollection',
          features: [],
        });
      }
    }
  }, [selectedRoute]);

  // Center on Selected Train
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedTrain) return;

    map.flyTo({
      center: [selectedTrain.current_lng, selectedTrain.current_lat],
      zoom: Math.max(map.getZoom(), 7.2),
      padding: { left: 420, top: 40, right: 40, bottom: 40 },
      duration: 1400,
      essential: true,
    });
  }, [selectedTrain]);

  // Render Orange Train Head Markers (PRD Req 5)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;
    // Show top 250 active trains on canvas for smooth 60fps performance + selected train
    const visibleTrains = trains.slice(0, 300);
    if (selectedTrain && !visibleTrains.some(t => t.train_number === selectedTrain.train_number)) {
      visibleTrains.unshift(selectedTrain);
    }

    const incomingKeys = new Set(visibleTrains.map((t) => t.train_number));

    Object.keys(currentMarkers).forEach((num) => {
      if (!incomingKeys.has(num)) {
        currentMarkers[num].marker.remove();
        delete currentMarkers[num];
      }
    });

    visibleTrains.forEach((train) => {
      const isSelected = selectedTrain?.train_number === train.train_number;

      if (!currentMarkers[train.train_number]) {
        const el = document.createElement('div');
        el.className = 'train-marker-wrapper';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `Train ${train.train_number} - ${train.train_name}`);

        // ORANGE TRAIN HEAD LOCOMOTIVE ICON (PRD Req 5)
        el.innerHTML = `
          <div class="train-marker-orange ${isSelected ? 'selected' : ''}" style="transform: rotate(${train.bearing_degrees || 0}deg);">
            <div class="orange-pulse"></div>
            <div class="locomotive-icon">
              <!-- Express Train Locomotive Head -->
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2C8 2 5 3.5 5 7v10c0 1.66 1.34 3 3 3l-1.5 1.5v.5h11v-.5L16 20c1.66 0 3-1.34 3-3V7c0-3.5-3-5-7-5zm0 2c3.5 0 5 1 5 3H7c0-2 1.5-3 5-3zm-5 5h10v5H7V9zm2 7.5a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z"/>
              </svg>
            </div>
          </div>
          <div class="marker-tooltip">
            <span class="tooltip-no">#${train.train_number}</span>
            <span class="tooltip-name">${train.train_name}</span>
            <span class="tooltip-route">${train.from_station_code} ? ${train.to_station_code}</span>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onSelectTrain(train);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([train.current_lng, train.current_lat])
          .addTo(map);

        currentMarkers[train.train_number] = {
          marker,
          el,
          lat: train.current_lat,
          lng: train.current_lng,
        };
      } else {
        const entry = currentMarkers[train.train_number];
        const markerEl = entry.el.querySelector('.train-marker-orange');

        if (markerEl) {
          if (isSelected) {
            markerEl.classList.add('selected');
          } else {
            markerEl.classList.remove('selected');
          }
          (markerEl as HTMLElement).style.transform = `rotate(${train.bearing_degrees || 0}deg)`;
        }

        if (entry.lat !== train.current_lat || entry.lng !== train.current_lng) {
          entry.marker.setLngLat([train.current_lng, train.current_lat]);
          entry.lat = train.current_lat;
          entry.lng = train.current_lng;
        }
      }
    });
  }, [trains, selectedTrain, onSelectTrain]);

  return (
    <div className="map-wrapper">
      <div ref={mapContainerRef} className="map-container" />
      <div className="star-overlay" />
    </div>
  );
};
