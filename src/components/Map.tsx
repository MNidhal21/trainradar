import React, { useEffect, useRef } from 'react';
import maplibregl, { Map as MapLibreMap, Marker } from 'maplibre-gl';
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
      maxZoom: 14,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
      'top-right'
    );

    const setupRouteLayers = () => {
      if (map.getSource('selected-train-route')) return;

      map.addSource('selected-train-route', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      // Traveled Route Glow & Line (Amber)
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
          'line-color': '#F2A64A',
          'line-width': 8,
          'line-opacity': 0.35,
          'line-blur': 4,
        },
      });

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
          'line-color': '#F2A64A',
          'line-width': 3.5,
          'line-dasharray': [2, 1.5],
        },
      });

      // Remaining Route Glow & Line (Solid Light Blue)
      map.addLayer({
        id: 'route-remaining-glow',
        type: 'line',
        source: 'selected-train-route',
        filter: ['==', ['get', 'segment'], 'remaining'],
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#7FC7F0',
          'line-width': 8,
          'line-opacity': 0.3,
          'line-blur': 4,
        },
      });

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
          'line-color': '#7FC7F0',
          'line-width': 3.5,
        },
      });
    };

    map.on('load', setupRouteLayers);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedTrain) return;

    map.flyTo({
      center: [selectedTrain.current_lng, selectedTrain.current_lat],
      zoom: Math.max(map.getZoom(), 6.5),
      padding: { left: 400, top: 20, right: 20, bottom: 20 },
      duration: 1400,
      essential: true,
    });
  }, [selectedTrain]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;
    const incomingKeys = new Set(trains.map((t) => t.train_number));

    Object.keys(currentMarkers).forEach((num) => {
      if (!incomingKeys.has(num)) {
        currentMarkers[num].marker.remove();
        delete currentMarkers[num];
      }
    });

    trains.forEach((train) => {
      const isSelected = selectedTrain?.train_number === train.train_number;
      const isPremium = ['Rajdhani', 'Shatabdi', 'Vande Bharat'].includes(train.train_type);

      if (!currentMarkers[train.train_number]) {
        const el = document.createElement('div');
        el.className = 'train-marker-wrapper';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `Train ${train.train_number} - ${train.train_name}`);

        el.innerHTML = `
          <div class="train-marker ${isPremium ? 'premium' : ''} ${isSelected ? 'selected' : ''}" style="transform: rotate(${train.bearing_degrees || 0}deg);">
            <div class="marker-pulse"></div>
            <div class="marker-icon">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
              </svg>
            </div>
          </div>
          <div class="marker-tooltip">
            <span class="tooltip-no">#${train.train_number}</span>
            <span class="tooltip-name">${train.train_name}</span>
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
        const markerEl = entry.el.querySelector('.train-marker');

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
