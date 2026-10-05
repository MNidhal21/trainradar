-- TrainRadar Database Schema (PRD Section 7)
-- Database for https://zfhgicixkggjdbuevjlu.supabase.co

-- 1. Current snapshot of every running train
CREATE TABLE IF NOT EXISTS public.trains_live (
  train_number TEXT PRIMARY KEY,
  train_name TEXT,
  train_type TEXT,              -- Rajdhani | Shatabdi | Vande Bharat | Superfast | Express | Passenger | Other
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  next_station_code TEXT,
  next_station_name TEXT,
  next_lat DOUBLE PRECISION,
  next_lng DOUBLE PRECISION,
  distance_covered_km NUMERIC,
  total_distance_km NUMERIC,
  delay_minutes INTEGER,
  bearing_degrees NUMERIC,
  status TEXT,                  -- RUNNING | DELAYED | ARRIVED
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Cached route geometry per train (refresh if fetched_at > 24h old)
CREATE TABLE IF NOT EXISTS public.train_routes (
  train_number TEXT PRIMARY KEY REFERENCES public.trains_live(train_number) ON DELETE CASCADE,
  route_geojson JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Optional station lookup
CREATE TABLE IF NOT EXISTS public.stations (
  station_code TEXT PRIMARY KEY,
  station_name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  state TEXT
);

-- Row Level Security (RLS)
ALTER TABLE public.trains_live ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.train_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

-- Public read policies
DO $do
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trains_live' AND policyname = 'public read trains_live') THEN
    CREATE POLICY "public read trains_live" ON public.trains_live FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'train_routes' AND policyname = 'public read train_routes') THEN
    CREATE POLICY "public read train_routes" ON public.train_routes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stations' AND policyname = 'public read stations') THEN
    CREATE POLICY "public read stations" ON public.stations FOR SELECT USING (true);
  END IF;
END $do;

-- Enable Realtime publication for trains_live
DO $do
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'trains_live'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trains_live;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $do;

-- Seed initial running trains for instant live display
INSERT INTO public.trains_live (
  train_number, train_name, train_type, current_lat, current_lng,
  next_station_code, next_station_name, next_lat, next_lng,
  distance_covered_km, total_distance_km, delay_minutes, bearing_degrees, status
) VALUES
  ('12301', 'Howrah Rajdhani Express', 'Rajdhani', 26.8467, 80.9462, 'CNB', 'Kanpur Central', 26.4499, 80.3319, 982, 1451, 8, 285, 'RUNNING'),
  ('12951', 'Mumbai Tejas Rajdhani', 'Rajdhani', 23.1765, 75.7885, 'RTM', 'Ratlam Junction', 23.3315, 75.0367, 735, 1386, 0, 195, 'RUNNING'),
  ('22436', 'Vande Bharat Express', 'Vande Bharat', 25.4358, 81.8463, 'PRYJ', 'Prayagraj Junction', 25.4498, 81.8285, 497, 759, 3, 120, 'RUNNING'),
  ('12002', 'Bhopal Shatabdi Express', 'Shatabdi', 27.1767, 78.0081, 'AGC', 'Agra Cantt', 27.1590, 77.9900, 195, 707, 12, 175, 'DELAYED'),
  ('12626', 'Kerala Superfast Express', 'Superfast', 17.3850, 78.4867, 'SC', 'Secunderabad Junction', 17.4399, 78.4983, 1620, 3036, 24, 185, 'DELAYED'),
  ('12618', 'Mangala Lakshadweep Express', 'Superfast', 15.2993, 74.1240, 'MAO', 'Madgaon Junction', 15.2736, 73.9582, 1980, 2769, 0, 160, 'RUNNING'),
  ('12841', 'Coromandel Express', 'Superfast', 19.8135, 85.8312, 'KUR', 'Khurda Road Junction', 20.1833, 85.6167, 480, 1662, 5, 210, 'RUNNING'),
  ('12138', 'Punjab Mail', 'Express', 28.7041, 77.1025, 'NDLS', 'New Delhi', 28.6139, 77.2090, 1510, 1930, 45, 165, 'DELAYED'),
  ('12424', 'Dibrugarh Rajdhani Express', 'Rajdhani', 26.1445, 91.7362, 'GHY', 'Guwahati', 26.1820, 91.7490, 1950, 2432, 0, 85, 'RUNNING'),
  ('16526', 'Island Express', 'Express', 9.9312, 76.2673, 'ERS', 'Ernakulam Junction', 9.9675, 76.2917, 810, 940, 15, 170, 'DELAYED'),
  ('12004', 'Lucknow Shatabdi', 'Shatabdi', 27.8974, 78.0880, 'ALJN', 'Aligarh Junction', 27.8900, 78.0700, 130, 511, 0, 115, 'RUNNING'),
  ('20901', 'Vande Bharat Express (Mumbai-Gandhinagar)', 'Vande Bharat', 21.1702, 72.8311, 'ST', 'Surat', 21.2040, 72.8400, 263, 522, 0, 355, 'RUNNING')
ON CONFLICT (train_number) DO UPDATE
SET 
  current_lat = EXCLUDED.current_lat,
  current_lng = EXCLUDED.current_lng,
  next_station_code = EXCLUDED.next_station_code,
  next_station_name = EXCLUDED.next_station_name,
  distance_covered_km = EXCLUDED.distance_covered_km,
  delay_minutes = EXCLUDED.delay_minutes,
  status = EXCLUDED.status,
  last_updated_at = NOW();

-- Seed sample cached route GeoJSON for selected trains
INSERT INTO public.train_routes (train_number, route_geojson)
VALUES 
  ('12301', '{
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": { "segment": "traveled" },
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [88.3639, 22.5726],
            [87.3200, 23.5500],
            [86.9700, 23.6800],
            [86.1500, 23.7900],
            [85.0000, 24.8000],
            [83.0000, 25.3200],
            [81.8500, 25.4400],
            [80.9462, 26.8467]
          ]
        }
      },
      {
        "type": "Feature",
        "properties": { "segment": "remaining" },
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [80.9462, 26.8467],
            [80.3319, 26.4499],
            [78.0081, 27.1767],
            [77.2090, 28.6139]
          ]
        }
      }
    ]
  }'::jsonb),
  ('22436', '{
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": { "segment": "traveled" },
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [77.2090, 28.6139],
            [80.3319, 26.4499],
            [81.8463, 25.4358]
          ]
        }
      },
      {
        "type": "Feature",
        "properties": { "segment": "remaining" },
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [81.8463, 25.4358],
            [82.9739, 25.3176]
          ]
        }
      }
    ]
  }'::jsonb)
ON CONFLICT (train_number) DO UPDATE
SET route_geojson = EXCLUDED.route_geojson, fetched_at = NOW();
