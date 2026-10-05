import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TrainLive, TrainRouteGeoJSON, TrainType } from './types/train';
import { fetchLiveTrains, fetchTrainRoute, subscribeToLiveTrains } from './lib/supabase';
import { fetchLiveTrainFromRailRadar } from './lib/railradar';
import { Map } from './components/Map';
import { TopBar } from './components/TopBar';
import { TrainDetailsPanel } from './components/TrainDetailsPanel';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [trains, setTrains] = useState<TrainLive[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<TrainLive | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<TrainRouteGeoJSON | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TrainType>('All');
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);

  // 1. Initial Load of all active trains
  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      const data = await fetchLiveTrains();
      if (isMounted) {
        setTrains(data);
        setIsRealtimeActive(true);
      }
    }

    loadInitial();

    // 2. Open Supabase Realtime channel
    const channel = subscribeToLiveTrains((updatedTrain) => {
      setTrains((prev) => {
        const index = prev.findIndex((t) => t.train_number === updatedTrain.train_number);
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...updatedTrain };
          return next;
        }
        return [updatedTrain, ...prev];
      });

      setSelectedTrain((cur) => {
        if (cur && cur.train_number === updatedTrain.train_number) {
          return { ...cur, ...updatedTrain };
        }
        return cur;
      });
    });

    // 3. Client-side Realtime Track Interpolation (glides trains along track coordinates every 8s)
    const interval = setInterval(() => {
      setTrains((prev) =>
        prev.map((t) => {
          if (t.status !== 'RUNNING') return t;
          // Micro step along current bearing
          const rad = (t.bearing_degrees * Math.PI) / 180;
          const step = 0.002; // ~200 meters
          const newLng = t.current_lng + Math.sin(rad) * step;
          const newLat = t.current_lat + Math.cos(rad) * step;
          return {
            ...t,
            current_lat: newLat,
            current_lng: newLng,
            distance_covered_km: t.distance_covered_km + 1,
          };
        })
      );
    }, 8000);

    return () => {
      isMounted = false;
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // 4. Handle Train Selection & Fetch Route
  const handleSelectTrain = useCallback(async (train: TrainLive) => {
    setSelectedTrain(train);
    setSelectedRoute(null);

    // Try RailRadar API live route & status first
    const railRadarResult = await fetchLiveTrainFromRailRadar(train.train_number);
    if (railRadarResult && railRadarResult.route) {
      if (railRadarResult.train) {
        setSelectedTrain((cur) => (cur ? { ...cur, ...railRadarResult.train } : train));
      }
      setSelectedRoute(railRadarResult.route);
      return;
    }

    // Fall back to pre-computed track route (traveled in blue vs remaining)
    const route = await fetchTrainRoute(train);
    setSelectedRoute(route);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedTrain(null);
    setSelectedRoute(null);
  }, []);

  // 5. Filtered trains
  const filteredTrains = useMemo(() => {
    return trains.filter((t) => {
      if (selectedType !== 'All' && t.train_type !== selectedType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNumber = t.train_number.toLowerCase().includes(q);
        const matchesName = t.train_name.toLowerCase().includes(q);
        const matchesFrom = (t.from_station_name || '').toLowerCase().includes(q) || (t.from_station_code || '').toLowerCase().includes(q);
        const matchesTo = (t.to_station_name || '').toLowerCase().includes(q) || (t.to_station_code || '').toLowerCase().includes(q);
        return matchesNumber || matchesName || matchesFrom || matchesTo;
      }
      return true;
    });
  }, [trains, selectedType, searchQuery]);

  return (
    <div className="app-root">
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        totalTrainsCount={trains.length}
        filteredCount={filteredTrains.length}
        isRealtimeActive={isRealtimeActive}
      />

      <main className="main-viewport">
        <Map
          trains={filteredTrains}
          selectedTrain={selectedTrain}
          selectedRoute={selectedRoute}
          onSelectTrain={handleSelectTrain}
        />

        <TrainDetailsPanel
          train={selectedTrain}
          onClose={handleClosePanel}
        />
      </main>

      <Footer />
    </div>
  );
};

export default App;
