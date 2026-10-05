export type TrainType =
  | 'All'
  | 'Rajdhani'
  | 'Shatabdi'
  | 'Vande Bharat'
  | 'Duronto'
  | 'Superfast'
  | 'Express'
  | 'Mail';

export interface TrainLive {
  train_number: string;
  train_name: string;
  train_type: string;
  current_lat: number;
  current_lng: number;
  from_station_code: string;
  from_station_name: string;
  to_station_code: string;
  to_station_name: string;
  departure_time: string;
  arrival_time: string;
  duration_h?: number;
  duration_m?: number;
  next_station_code?: string;
  next_station_name?: string;
  next_lat?: number | null;
  next_lng?: number | null;
  distance_covered_km: number;
  total_distance_km: number;
  delay_minutes: number;
  bearing_degrees: number;
  status: 'RUNNING' | 'DELAYED' | 'ARRIVED';
  last_updated_at: string;
}

export interface TrainRouteFeature {
  type: 'Feature';
  properties: {
    segment: 'traveled' | 'remaining';
    name?: string;
  };
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
}

export interface TrainRouteGeoJSON {
  type: 'FeatureCollection';
  features: TrainRouteFeature[];
}

export interface TrainRoute {
  train_number: string;
  route_geojson: TrainRouteGeoJSON;
  fetched_at?: string;
}
