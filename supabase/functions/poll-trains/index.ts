import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const RAILRADAR_API_KEY = Deno.env.get('RAILRADAR_API_KEY') || '';

serve(async (req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!RAILRADAR_API_KEY) {
      console.warn('RAILRADAR_API_KEY is not set. Skipping RailRadar external fetch.');
      return new Response(
        JSON.stringify({ ok: false, error: 'RAILRADAR_API_KEY secret missing' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Bulk snapshot endpoint from RailRadar
    const response = await fetch('https://railradar.in/api/v1/trains/live', {
      headers: {
        'Authorization': Bearer ,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ ok: false, status: response.status, error: errText }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const trains = Array.isArray(data) ? data : data.trains || [];

    if (trains.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, count: 0, message: 'No active trains returned' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const rows = trains.map((t: any) => ({
      train_number: String(t.train_number || t.number),
      train_name: t.train_name || t.name || '',
      train_type: t.train_type || t.type || 'Express',
      current_lat: Number(t.current_lat || t.lat),
      current_lng: Number(t.current_lng || t.lng),
      next_station_code: t.next_station_code || '',
      next_station_name: t.next_station_name || '',
      next_lat: t.next_lat ? Number(t.next_lat) : null,
      next_lng: t.next_lng ? Number(t.next_lng) : null,
      distance_covered_km: Number(t.distance_covered_km || 0),
      total_distance_km: Number(t.total_distance_km || 0),
      delay_minutes: Number(t.delay_minutes || 0),
      bearing_degrees: Number(t.bearing_degrees || 0),
      status: t.status || 'RUNNING',
      last_updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('trains_live')
      .upsert(rows, { onConflict: 'train_number' });

    if (error) throw error;

    return new Response(
      JSON.stringify({ ok: true, upserted_count: rows.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
