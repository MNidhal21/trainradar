import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { TrainLive, TrainRouteGeoJSON } from '../types/train';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zfhgicixkggjdbuevjlu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmaGdpY2l4a2dnamRidWV2amx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTY2MDcsImV4cCI6MjEwNjIzMjYwN30.Eqwlv9GQ5eCtTbM1-hYFjq34MZrHIhbOz6Y4_qneagM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

let cachedActiveTrains: TrainLive[] | null = null;
let cachedRoutesMap: Record<string, { traveled: [number, number][]; remaining: [number, number][] }> | null = null;

/**
 * Fetch all comprehensive active running trains across India
 * (Combines national active trains dataset + live updates from Supabase)
 */
export async function fetchLiveTrains(): Promise<TrainLive[]> {
  if (!cachedActiveTrains) {
    try {
      const res = await fetch('./data/active_trains.json');
      if (res.ok) {
        cachedActiveTrains = await res.json();
      }
    } catch (e) {
      console.warn('Could not load active_trains.json:', e);
    }
  }

  // Also query Supabase trains_live to merge any real-time DB rows
  try {
    const { data } = await supabase.from('trains_live').select('*').limit(100);
    if (data && data.length > 0 && cachedActiveTrains) {
      const dbMap = new Map(data.map((t: any) => [t.train_number, t]));
      return cachedActiveTrains.map((t) => {
        const fromDb = dbMap.get(t.train_number);
        return fromDb ? { ...t, ...fromDb } : t;
      });
    }
  } catch {
    // Return cachedActiveTrains if Supabase query times out
  }

  return cachedActiveTrains || [];
}

/**
 * Fetch detailed route LineStrings (traveled in blue vs remaining)
 */
export async function fetchTrainRoute(train: TrainLive): Promise<TrainRouteGeoJSON | null> {
  // Check train_routes_map.json
  if (!cachedRoutesMap) {
    try {
      const res = await fetch('./data/train_routes_map.json');
      if (res.ok) {
        cachedRoutesMap = await res.json();
      }
    } catch (e) {
      console.warn('Could not load train_routes_map.json:', e);
    }
  }

  if (cachedRoutesMap && cachedRoutesMap[train.train_number]) {
    const route = cachedRoutesMap[train.train_number];
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { segment: 'traveled' },
          geometry: {
            type: 'LineString',
            coordinates: route.traveled,
          },
        },
        {
          type: 'Feature',
          properties: { segment: 'remaining' },
          geometry: {
            type: 'LineString',
            coordinates: route.remaining,
          },
        },
      ],
    };
  }

  // Fallback to coordinates synthesized from track
  const currentPos: [number, number] = [train.current_lng, train.current_lat];
  const nextPos: [number, number] = train.next_lng && train.next_lat
    ? [train.next_lng, train.next_lat]
    : [train.current_lng + 0.5, train.current_lat + 0.5];

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { segment: 'traveled' },
        geometry: {
          type: 'LineString',
          coordinates: [[currentPos[0] - 0.8, currentPos[1] - 0.6], currentPos],
        },
      },
      {
        type: 'Feature',
        properties: { segment: 'remaining' },
        geometry: {
          type: 'LineString',
          coordinates: [currentPos, nextPos],
        },
      },
    ],
  };
}

/**
 * Subscribe to live updates via Supabase Realtime
 */
export function subscribeToLiveTrains(onUpdate: (train: TrainLive) => void): RealtimeChannel {
  return supabase
    .channel('trains_live_channel')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'trains_live' },
      (payload) => {
        if (payload.new && (payload.new as any).train_number) {
          onUpdate(payload.new as TrainLive);
        }
      }
    )
    .subscribe();
}
