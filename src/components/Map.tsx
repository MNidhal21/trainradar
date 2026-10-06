import React, { useEffect, useRef } from 'react';
import maplibregl, { Map as MapLibreMap, Popup } from 'maplibre-gl';
import { Compass } from 'lucide-react';
import { TrainLive, TrainRouteGeoJSON } from '../types/train';
import { DARK_MAP_STYLE_URL, applyMapBrightness } from '../lib/mapStyle';

interface MapProps {
  trains: TrainLive[];
  selectedTrain: TrainLive | null;
  selectedRoute: TrainRouteGeoJSON | null;
  onSelectTrain: (train: TrainLive) => void;
}

/**
 * Creates high-DPI orange locomotive train head icon
 */
function createOrangeTrainHeadImage(): ImageData {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  // Outer orange glow corona
  const glow = ctx.createRadialGradient(cx, cy, 14, cx, cy, 31);
  glow.addColorStop(0, 'rgba(249, 115, 22, 0.95)');
  glow.addColorStop(0.5, 'rgba(234, 88, 12, 0.45)');
  glow.addColorStop(1, 'rgba(234, 88, 12, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, 31, 0, Math.PI * 2);
  ctx.fill();

  // Orange circular body
  const bodyGrad = ctx.createLinearGradient(cx - 18, cy - 18, cx + 18, cy + 18);
  bodyGrad.addColorStop(0, '#fb923c');
  bodyGrad.addColorStop(1, '#ea580c');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 21, 0, Math.PI * 2);
  ctx.fill();

  // Crisp White Outer Border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Forward Directional Locomotive Nose (points up at 0 deg)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx, cy - 18);
  ctx.lineTo(cx + 6, cy - 9);
  ctx.lineTo(cx - 6, cy - 9);
  ctx.closePath();
  ctx.fill();

  // Locomotive Cab Body
  const rx = cx - 7;
  const ry = cy - 8;
  const rw = 14;
  const rh = 18;
  const r = 3;
  ctx.beginPath();
  ctx.moveTo(rx + r, ry);
  ctx.lineTo(rx + rw - r, ry);
  ctx.arcTo(rx + rw, ry, rx + rw, ry + r, r);
  ctx.lineTo(rx + rw, ry + rh - r);
  ctx.arcTo(rx + rw, ry + rh, rx + rw - r, ry + rh, r);
  ctx.lineTo(rx + r, ry + rh);
  ctx.arcTo(rx, ry + rh, rx, ry + rh - r, r);
  ctx.lineTo(rx, ry + r);
  ctx.arcTo(rx, ry, rx + r, ry, r);
  ctx.closePath();
  ctx.fill();

  // Locomotive Windshield
  ctx.fillStyle = '#9a3412';
  ctx.fillRect(cx - 5, cy - 5, 10, 4);

  // Twin Front Headlights (bright yellow)
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(cx - 4, cy + 6.5, 1.8, 0, Math.PI * 2);
  ctx.arc(cx + 4, cy + 6.5, 1.8, 0, Math.PI * 2);
  ctx.fill();

  return ctx.getImageData(0, 0, size, size);
}

export const Map: React.FC<MapProps> = ({
  trains,
  selectedTrain,
  selectedRoute,
  onSelectTrain,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const hoverPopupRef = useRef<Popup | null>(null);
  const trainsRef = useRef<TrainLive[]>(trains);
  trainsRef.current = trains;
  const selectedRouteRef = useRef<TrainRouteGeoJSON | null>(selectedRoute);
  selectedRouteRef.current = selectedRoute;

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: DARK_MAP_STYLE_URL,
      center: [78.9629, 22.5937],
      zoom: 4.8,
      minZoom: 3.5,
      maxZoom: 16,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: true, visualizePitch: true }),
      'top-right'
    );

    map.on('load', () => {
      // 1. Boost brightness & contrast
      applyMapBrightness(map);

      // Register orange locomotive icon
      const trainIcon = createOrangeTrainHeadImage();
      map.addImage('train-locomotive-orange', trainIcon, { pixelRatio: 2 });

      // 2. ADD ALL INDIAN RAILWAY TRACKS (Red Dotted Lines)
      if (!map.getSource('railway-tracks')) {
        map.addSource('railway-tracks', {
          type: 'geojson',
          data: './data/railway_tracks.json',
        });

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
            'line-width': 3.2,
            'line-opacity': 0.3,
            'line-blur': 1.8,
          },
        });

        map.addLayer({
          id: 'railway-tracks-dotted',
          type: 'line',
          source: 'railway-tracks',
          layout: {
            'line-join': 'miter',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#ef4444',
            'line-width': 1.8,
            'line-opacity': 0.9,
            'line-dasharray': [1.2, 2.4],
          },
        });
      }

      // 3. ADD ALL INDIAN RAILWAY STATIONS (Green Dots)
      if (!map.getSource('railway-stations')) {
        map.addSource('railway-stations', {
          type: 'geojson',
          data: './data/railway_stations.json',
        });

        map.addLayer({
          id: 'railway-stations-glow',
          type: 'circle',
          source: 'railway-stations',
          minzoom: 4.0,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 2, 7, 5, 11, 8],
            'circle-color': '#10b981',
            'circle-opacity': 0.4,
            'circle-blur': 1,
          },
        });

        map.addLayer({
          id: 'railway-stations-dot',
          type: 'circle',
          source: 'railway-stations',
          minzoom: 4.0,
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 4, 1.5, 7, 3, 11, 5],
            'circle-color': '#22c55e',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#064e3b',
          },
        });

        map.addLayer({
          id: 'railway-stations-label',
          type: 'symbol',
          source: 'railway-stations',
          minzoom: 8.5,
          layout: {
            'text-field': ['concat', ['get', 'name'], ' (', ['get', 'code'], ')'],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size': 11,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
          },
          paint: {
            'text-color': '#4ade80',
            'text-halo-color': '#062d22',
            'text-halo-width': 2,
          },
        });

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
                <span class="station-popup-state">${props.state || ''} ${props.zone ? '• Zone: ' + props.zone : ''}</span>
              </div>
            `)
            .addTo(map);
        });
      }

      // 4. SELECTED TRAIN ROUTE (Vibrant Blue Traveled Tail)
      if (!map.getSource('selected-train-route')) {
        map.addSource('selected-train-route', {
          type: 'geojson',
          data: selectedRouteRef.current || {
            type: 'FeatureCollection',
            features: [],
          },
        });

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
            'line-color': '#00e5ff',
            'line-width': 20,
            'line-opacity': 0.85,
            'line-blur': 8,
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
            'line-color': '#00d2ff',
            'line-width': 7.5,
            'line-opacity': 1.0,
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
            'line-color': '#7dd3fc',
            'line-width': 3,
            'line-dasharray': [2, 2],
            'line-opacity': 0.75,
          },
        });
      }

      // 5. ALL ACTIVE RUNNING TRAINS (Orange Locomotive Heads)
      if (!map.getSource('trains-live-source')) {
        const initialFeatures = trainsRef.current.map((t) => ({
          type: 'Feature' as const,
          id: t.train_number,
          properties: {
            train_number: String(t.train_number).trim(),
            train_name: t.train_name,
            train_type: t.train_type,
            bearing_degrees: t.bearing_degrees || 0,
            from_station_code: t.from_station_code,
            to_station_code: t.to_station_code,
            departure_time: t.departure_time,
            arrival_time: t.arrival_time,
            status: t.status,
            delay_minutes: t.delay_minutes || 0,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [t.current_lng, t.current_lat],
          },
        }));

        map.addSource('trains-live-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: initialFeatures,
          },
        });

        map.addLayer({
          id: 'trains-live-glow',
          type: 'circle',
          source: 'trains-live-source',
          paint: {
            'circle-radius': [
              'interpolate', ['linear'], ['zoom'],
              4, 4,
              7, 7,
              12, 11
            ],
            'circle-color': '#f97316',
            'circle-opacity': 0.5,
            'circle-blur': 0.8,
          },
        });

        map.addLayer({
          id: 'trains-live-head',
          type: 'symbol',
          source: 'trains-live-source',
          layout: {
            'icon-image': 'train-locomotive-orange',
            'icon-size': [
              'interpolate', ['linear'], ['zoom'],
              4, 0.5,
              7, 0.75,
              11, 1.05
            ],
            'icon-rotate': ['get', 'bearing_degrees'],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          },
        });

        map.addLayer({
          id: 'trains-live-label',
          type: 'symbol',
          source: 'trains-live-source',
          minzoom: 8.5,
          layout: {
            'text-field': ['concat', '#', ['get', 'train_number'], ' ', ['get', 'train_name']],
            'text-size': 11,
            'text-offset': [0, 1.5],
            'text-anchor': 'top',
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          },
          paint: {
            'text-color': '#fb923c',
            'text-halo-color': '#111827',
            'text-halo-width': 2,
          },
        });

        // 6. Selected Train Pulse Ring
        map.addSource('trains-selected-source', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        });

        map.addLayer({
          id: 'train-selected-ring',
          type: 'circle',
          source: 'trains-selected-source',
          paint: {
            'circle-radius': 22,
            'circle-color': '#00e5ff',
            'circle-opacity': 0.35,
            'circle-stroke-width': 4,
            'circle-stroke-color': '#ffffff',
          },
        });

        // Interactive Click Selection
        const handleTrainClick = (e: any) => {
          const feat = e.features?.[0];
          if (!feat) return;
          const rawNum = feat.properties?.train_number;
          const strNum = String(rawNum ?? '').trim();
          const intNum = parseInt(strNum, 10);

          const found = trainsRef.current.find((t) => {
            const tNum = String(t.train_number).trim();
            return (
              tNum === strNum ||
              tNum === strNum.padStart(5, '0') ||
              (!isNaN(intNum) && parseInt(tNum, 10) === intNum)
            );
          });

          if (found) {
            onSelectTrain(found);
          }
        };

        map.on('click', 'trains-live-head', handleTrainClick);
        map.on('click', 'trains-live-glow', handleTrainClick);

        // Hover tooltip
        const hoverPopup = new Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 14,
          className: 'train-hover-popup',
        });
        hoverPopupRef.current = hoverPopup;

        map.on('mouseenter', 'trains-live-head', (e: any) => {
          map.getCanvas().style.cursor = 'pointer';
          const feat = e.features?.[0];
          if (!feat) return;
          const geom = feat.geometry as any;
          const p = feat.properties as any;
          hoverPopup
            .setLngLat(geom.coordinates)
            .setHTML(`
              <div class="hover-popup-content">
                <span class="hover-train-no">#${p.train_number}</span>
                <span class="hover-train-name">${p.train_name}</span>
                <span class="hover-train-route">${p.from_station_code} → ${p.to_station_code}</span>
              </div>
            `)
            .addTo(map);
        });

        map.on('mouseleave', 'trains-live-head', () => {
          map.getCanvas().style.cursor = '';
          hoverPopup.remove();
        });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update All Trains Live GeoJSON
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateTrainsData = () => {
      const source = map.getSource('trains-live-source') as maplibregl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: trains.map((t) => ({
            type: 'Feature',
            id: t.train_number,
            properties: {
              train_number: String(t.train_number).trim(),
              train_name: t.train_name,
              train_type: t.train_type,
              bearing_degrees: t.bearing_degrees || 0,
              from_station_code: t.from_station_code,
              to_station_code: t.to_station_code,
              departure_time: t.departure_time,
              arrival_time: t.arrival_time,
              status: t.status,
              delay_minutes: t.delay_minutes || 0,
            },
            geometry: {
              type: 'Point',
              coordinates: [t.current_lng, t.current_lat],
            },
          })),
        });
      }
    };

    if (map.isStyleLoaded()) {
      updateTrainsData();
    } else {
      map.once('load', updateTrainsData);
    }
  }, [trains]);

  // Update Selected Train Highlight Ring
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateSelectedRing = () => {
      const selectedSource = map.getSource('trains-selected-source') as maplibregl.GeoJSONSource;
      if (selectedSource) {
        if (selectedTrain) {
          selectedSource.setData({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: [selectedTrain.current_lng, selectedTrain.current_lat],
                },
              },
            ],
          });
        } else {
          selectedSource.setData({
            type: 'FeatureCollection',
            features: [],
          });
        }
      }
    };

    if (map.isStyleLoaded()) {
      updateSelectedRing();
    } else {
      map.once('load', updateSelectedRing);
    }
  }, [selectedTrain]);

  // Update Route Layers when selectedRoute changes (Traveled Tail in Electric Cyan-Blue)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateRouteData = () => {
      const source = map.getSource('selected-train-route') as maplibregl.GeoJSONSource;
      if (source) {
        if (selectedRoute) {
          source.setData(selectedRoute as any);
          if (map.getLayer('route-traveled-line')) {
            map.moveLayer('route-traveled-glow');
            map.moveLayer('route-traveled-line');
            map.moveLayer('route-remaining-line');
            if (map.getLayer('trains-live-glow')) map.moveLayer('trains-live-glow');
            if (map.getLayer('trains-live-head')) map.moveLayer('trains-live-head');
            if (map.getLayer('train-selected-ring')) map.moveLayer('train-selected-ring');
          }
        } else {
          source.setData({
            type: 'FeatureCollection',
            features: [],
          });
        }
      }
    };

    if (map.isStyleLoaded()) {
      updateRouteData();
    } else {
      map.once('load', updateRouteData);
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

  const handleResetView = () => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [78.9629, 22.5937],
      zoom: 4.8,
      duration: 1200,
      essential: true,
    });
  };

  return (
    <div className="map-wrapper">
      <div ref={mapContainerRef} className="map-container" />
      <button
        className="map-center-btn"
        onClick={handleResetView}
        title="Reset view to whole India"
      >
        <Compass size={16} />
        <span>India View</span>
      </button>
    </div>
  );
};

export default Map;
