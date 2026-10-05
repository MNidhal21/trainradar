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

    const channel = subscribeToLiveTrains((updatedTrain) => {
      setTrains((prev) => {
        const index = prev.findIndex((t) => t.train_number === updatedTrain.train_number);
        if (index >= 0) {
          const next = [...prev];
          next[index] = updatedTrain;
          return next;
        }
        return [updatedTrain, ...prev];
      });

      setSelectedTrain((cur) => {
        if (cur && cur.train_number === updatedTrain.train_number) {
          return updatedTrain;
        }
        return cur;
      });
    });

    return () => {
      isMounted = false;
      channel.unsubscribe();
    };
  }, []);

  const handleSelectTrain = useCallback(async (train: TrainLive) => {
    setSelectedTrain(train);
    setSelectedRoute(null);

    // 1. Try RailRadar API live route & status first
    const railRadarResult = await fetchLiveTrainFromRailRadar(train.train_number);
    if (railRadarResult && railRadarResult.route) {
      if (railRadarResult.train) {
        setSelectedTrain((cur) => (cur ? { ...cur, ...railRadarResult.train } : train));
      }
      setSelectedRoute(railRadarResult.route);
      return;
    }

    // 2. Fall back to Supabase route cache or synthesized route
    const route = await fetchTrainRoute(train);
    setSelectedRoute(route);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedTrain(null);
    setSelectedRoute(null);
  }, []);

  const filteredTrains = useMemo(() => {
    return trains.filter((t) => {
      if (selectedType !== 'All' && t.train_type !== selectedType) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNumber = t.train_number.toLowerCase().includes(q);
        const matchesName = t.train_name.toLowerCase().includes(q);
        return matchesNumber || matchesName;
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
