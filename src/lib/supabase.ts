import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { TrainLive, TrainRouteGeoJSON } from '../types/train';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zfhgicixkggjdbuevjlu.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmaGdpY2l4a2dnamRidWV2amx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NTY2MDcsImV4cCI6MjEwNjIzMjYwN30.Eqwlv9GQ5eCtTbM1-hYFjq34MZrHIhbOz6Y4_qneagM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Resilient default seed trains matching PRD Section 7
export const DEFAULT_TRAINS: TrainLive[] = [
  {
    train_number: '12301',
    train_name: 'Howrah Rajdhani Express',
    train_type: 'Rajdhani',
    current_lat: 26.8467,
    current_lng: 80.9462,
    next_station_code: 'CNB',
    next_station_name: 'Kanpur Central',
    next_lat: 26.4499,
    next_lng: 80.3319,
    distance_covered_km: 982,
    total_distance_km: 1451,
    delay_minutes: 8,
    bearing_degrees: 285,
    status: 'RUNNING',
    last_updated_at: new Date().toISOString(),
  },
  {
    train_number: '12951',
    train_name: 'Mumbai Tejas Rajdhani',
    train_type: 'Rajdhani',
    current_lat: 23.1765,
    current_lng: 75.7885,
    next_station_code: 'RTM',
    next_station_name: 'Ratlam Junction',
    next_lat: 23.3315,
    next_lng: 75.0367,
    distance_covered_km: 735,
    total_distance_km: 1386,
    delay_minutes: 0,
    bearing_degrees: 195,
    status: 'RUNNING',
    last_updated_at: new Date().toISOString(),
  },
  {
    train_number: '22436',
    train_name: 'Vande Bharat Express',
    train_type: 'Vande Bharat',
    current_lat: 25.4358,
    current_lng: 81.8463,
    next_station_code: 'PRYJ',
    next_station_name: 'Prayagraj Junction',
    next_lat: 25.4498,
    next_lng: 81.8285,
    distance_covered_km: 497,
    total_distance_km: 759,
    delay_minutes: 3,
    bearing_degrees: 120,
    status: 'RUNNING',
    last_updated_at: new Date().toISOString(),
  },
  {
    train_number: '12002',
    train_name: 'Bhopal Shatabdi Express',
    train_type: 'Shatabdi',
    current_lat: 27.1767,
    current_lng: 78.0081,
    next_station_code: 'AGC',
    next_station_name: 'Agra Cantt',
    next_lat: 27.1590,
    next_lng: 77.9900,
    distance_covered_km: 195,
    total_distance_km: 707,
    delay_minutes: 12,
    bearing_degrees: 175,
    status: 'DELAYED',
    last_updated_at: new Date().toISOString(),
  },
  {
    train_number: '12626',
    train_name: 'Kerala Superfast Express',
    train_type: 'Superfast',
    current_lat: 17.3850,
    current_lng: 78.4867,
    next_station_code: 'SC',
    next_station_name: 'Secunderabad Junction',
    next_lat: 17.4399,
    next_lng: 78.4983,
    distance_covered_km: 1620,
    total_distance_km: 3036,
    delay_minutes: 24,
    bearing_degrees: 185,
    status: 'DELAYED',
    last_updated_at: new Date().toISOString(),
  },
  {
    train_number: '12618',
    train_name: 'Mangala Lakshadweep Express',
    train_type: 'Superfast',
    current_lat: 15.2993,
    current_lng: 74.1240,
    next_station_code: 'MAO',
    next_station_name: 'Madgaon Junction',
    next_lat: 15.2736,
    next_lng: 73.9582,
    distance_covered_km: 1980,
    total_distance_km: 2769,
    delay_minutes: 0,
    bearing_degrees: 160,
    status: 'RUNNING',
    last_updated_at: new Date().toISOString(),
  },
  {
    train_number: '12841',
    train_name: 'Coromandel Express',
    train_type: 'Superfast',
    current_lat: 19.8135,
    current_lng: 85.8312,
    next_station_code: 'KUR',
    next_station_name: 'Khurda Road Junction',
    next_lat: 20.1833,
    next_lng: 85.6167,
    distance_covered_km: 480,
    total_distance_km: 1662,
    delay_minutes: 5,
    bearing_degrees: 210,
    status: 'RUNNING',
    last_updated_at: new Date().toISOString(),
  },
  {
    train_number: '12138',
    train_name: 'Punjab Mail',
    train_type: 'Express',
    current_lat: 28.7041,
    current_lng: 77.1025,
    next_station_code: 'NDLS',
    next_station_name: 'New Delhi',
    next_lat: 28.6139,
    next_lng: 77.2090,
    distance_covered_km: 1510,
    total_distance_km: 1930,
    delay_minutes: 45,
    bearing_degrees: 165,
    status: 'DELAYED',
    last_updated_at: new Date().toISOString(),
  },
  {
    train_number: '12424',
    train_name: 'Dibrugarh Rajdhani Express',
    train_type: 'Rajdhani',
    current_lat: 26.1445,
    current_lng: 91.7362,
    next_station_code: 'GHY',
    next_station_name: 'Guwahati',
    next_lat: 26.1820,
    next_lng: 91.7490,
    distance_covered_km: 1950,
    total_distance_km: 2432,
    delay_minutes: 0,
    bearing_degrees: 85,
    status: 'RUNNING',
    last_updated_at: new Date().toISOString(),
  },
  {
    train_number: '16526',
    train_name: 'Island Express',
    train_type: 'Express',
    current_lat: 9.9312,
    current_lng: 76.2673,
    next_station_code: 'ERS',
    next_station_name: 'Ernakulam Junction',
    next_lat: 9.9675,
    next_lng: 76.2917,
    distance_covered_km: 810,
    total_distance_km: 940,
    delay_minutes: 15,
    bearing_degrees: 170,
    status: 'DELAYED',
    last_updated_at: new Date().toISOString(),
  },
  {
    train_number: '12004',
    train_name: 'Lucknow Shatabdi',
    train_type: 'Shatabdi',
    current_lat: 27.8974,
    current_lng: 78.0880,
    next_station_code: 'ALJN',
    next_station_name: 'Aligarh Junction',
    next_lat: 27.8900,
    next_lng: 78.0700,
    distance_covered_km: 130,
    total_distance_km: 511,
    delay_minutes: 0,
    bearing_degrees: 115,
    status: 'RUNNING',
    last_updated_at: new Date().toISOString(),
  },
  {
    train_number: '20901',
    train_name: 'Vande Bharat Express (Mumbai-Gandhinagar)',
    train_type: 'Vande Bharat',
    current_lat: 21.1702,
    current_lng: 72.8311,
    next_station_code: 'ST',
    next_station_name: 'Surat',
    next_lat: 21.2040,
    next_lng: 72.8400,
    distance_covered_km: 263,
    total_distance_km: 522,
    delay_minutes: 0,
    bearing_degrees: 355,
    status: 'RUNNING',
    last_updated_at: new Date().toISOString(),
  },
];

/**
 * Fetch all running trains from Supabase trains_live
 */
export async function fetchLiveTrains(): Promise<TrainLive[]> {
  try {
    const { data, error } = await supabase
      .from('trains_live')
      .select('*')
      .order('last_updated_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return DEFAULT_TRAINS;
    }
    return data as TrainLive[];
  } catch {
    return DEFAULT_TRAINS;
  }
}

/**
 * Fetch train route GeoJSON:
 * 1. Checks Supabase train_routes table
 * 2. Generates dynamic geodesic line if not yet cached in db
 */
export async function fetchTrainRoute(train: TrainLive): Promise<TrainRouteGeoJSON | null> {
  try {
    const { data, error } = await supabase
      .from('train_routes')
      .select('route_geojson')
      .eq('train_number', train.train_number)
      .maybeSingle();

    if (!error && data && data.route_geojson) {
      return data.route_geojson as TrainRouteGeoJSON;
    }
  } catch {
    // Continue to dynamic generator
  }

  // Construct realistic 2-part route GeoJSON (traveled vs remaining)
  const currentPos: [number, number] = [train.current_lng, train.current_lat];
  const nextPos: [number, number] = train.next_lng && train.next_lat 
    ? [train.next_lng, train.next_lat]
    : [train.current_lng + 0.5, train.current_lat + 0.5];

  // Synthesize route points along the bearing
  const rad = ((train.bearing_degrees || 90) * Math.PI) / 180;
  const backLng = train.current_lng - Math.sin(rad) * 1.8;
  const backLat = train.current_lat - Math.cos(rad) * 1.8;

  const traveledCoordinates: [number, number][] = [
    [backLng - 1.2, backLat - 1.0],
    [backLng, backLat],
    currentPos,
  ];

  const remainingCoordinates: [number, number][] = [
    currentPos,
    nextPos,
    [nextPos[0] + Math.sin(rad) * 1.5, nextPos[1] + Math.cos(rad) * 1.5],
  ];

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { segment: 'traveled' },
        geometry: {
          type: 'LineString',
          coordinates: traveledCoordinates,
        },
      },
      {
        type: 'Feature',
        properties: { segment: 'remaining' },
        geometry: {
          type: 'LineString',
          coordinates: remainingCoordinates,
        },
      },
    ],
  };
}

/**
 * Subscribe to live updates via Supabase Realtime (PRD Section 9)
 */
export function subscribeToLiveTrains(
  onUpdate: (train: TrainLive) => void
): RealtimeChannel {
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
