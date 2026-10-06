import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TrainLive, TrainRouteGeoJSON } from './types/train';
import { fetchLiveTrains, subscribeToLiveTrains } from './lib/supabase';
import { fetchLiveTrainFromRailRadar } from './lib/railradar';
import { loadRoutesMap, stepTrainsOnTrack, getRouteForSelectedTrain, RouteGeometry } from './lib/trackEngine';
import { Map } from './components/Map';
import { TopBar } from './components/TopBar';
import { TrainDetailsPanel } from './components/TrainDetailsPanel';

export const App: React.FC = () => {
  const [trains, setTrains] = useState<TrainLive[]>([]);
  const [selectedTrain, setSelectedTrain] = useState<TrainLive | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<TrainRouteGeoJSON | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);

  const routesMapRef = useRef<Record<string, RouteGeometry>>({});
  const selectedTrainRef = useRef<TrainLive | null>(null);
  selectedTrainRef.current = selectedTrain;

  // 1. Initial Load of all active trains & nationwide route network
  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      const [trainsData, routesMap] = await Promise.all([
        fetchLiveTrains(),
        loadRoutesMap(),
      ]);

      if (isMounted) {
        routesMapRef.current = routesMap;
        setTrains(trainsData);
        setIsRealtimeActive(true);

        if (selectedTrainRef.current) {
          const r = getRouteForSelectedTrain(selectedTrainRef.current, routesMap);
          if (r) setSelectedRoute(r);
        }
      }
    }

    loadInitial();

    // 2. Open Supabase Realtime channel for live updates
    const channel = subscribeToLiveTrains((updatedTrain) => {
      setTrains((prev) => {
        const norm = String(updatedTrain.train_number).trim();
        const index = prev.findIndex((t) => String(t.train_number).trim() === norm);
        if (index >= 0) {
          const next = [...prev];
          next[index] = { ...next[index], ...updatedTrain };
          return next;
        }
        return [updatedTrain, ...prev];
      });

      setSelectedTrain((cur) => {
        if (cur && String(cur.train_number).trim() === String(updatedTrain.train_number).trim()) {
          return { ...cur, ...updatedTrain };
        }
        return cur;
      });
    });

    // 3. Realtime Track Gliding Engine: Stepping trains along their tracks every 3 seconds
    const interval = setInterval(() => {
      setTrains((prev) => {
        if (prev.length === 0) return prev;
        const updated = stepTrainsOnTrack(prev, routesMapRef.current, 3);

        const currentSel = selectedTrainRef.current;
        if (currentSel) {
          const selNum = String(currentSel.train_number).trim();
          const matching = updated.find((t) => String(t.train_number).trim() === selNum);
          if (matching) {
            setSelectedTrain(matching);
            const route = getRouteForSelectedTrain(matching, routesMapRef.current);
            if (route) {
              setSelectedRoute(route);
            }
          }
        }

        return updated;
      });
    }, 3000);

    return () => {
      isMounted = false;
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // 4. Handle Train Selection & Fetch Route (Traveled Tail in Blue)
  const handleSelectTrain = useCallback(async (train: TrainLive) => {
    setSelectedTrain(train);

    // Compute instantaneous on-track traveled route (blue) vs remaining route
    const instantRoute = getRouteForSelectedTrain(train, routesMapRef.current);
    if (instantRoute) {
      setSelectedRoute(instantRoute);
    }

    // Check live telemetry from RailRadar API if available (keep track geometry for route)
    try {
      const railRadarResult = await fetchLiveTrainFromRailRadar(train.train_number);
      if (railRadarResult && railRadarResult.train) {
        setSelectedTrain((cur) => (cur ? { ...cur, ...railRadarResult.train } : train));
      }
    } catch {
      // Kept instantRoute
    }
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedTrain(null);
    setSelectedRoute(null);
  }, []);

  // 5. Filtered trains
  const filteredTrains = useMemo(() => {
    if (!searchQuery.trim()) return trains;

    const q = searchQuery.toLowerCase().trim();
    return trains.filter((t) => {
      const matchesNumber = String(t.train_number).toLowerCase().includes(q);
      const matchesName = (t.train_name || '').toLowerCase().includes(q);
      const matchesFrom =
        (t.from_station_name || '').toLowerCase().includes(q) ||
        (t.from_station_code || '').toLowerCase().includes(q);
      const matchesTo =
        (t.to_station_name || '').toLowerCase().includes(q) ||
        (t.to_station_code || '').toLowerCase().includes(q);
      return matchesNumber || matchesName || matchesFrom || matchesTo;
    });
  }, [trains, searchQuery]);

  return (
    <div className="app-root">
      <TopBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalTrainsCount={trains.length}
        filteredCount={filteredTrains.length}
        isRealtimeActive={isRealtimeActive}
        matchingTrains={filteredTrains}
        onSelectTrain={handleSelectTrain}
      />

      <main className="main-viewport full-height">
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
    </div>
  );
};

export default App;
