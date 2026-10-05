import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const RAILRADAR_API_KEY = Deno.env.get('RAILRADAR_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const trainNumber = url.searchParams.get('train_number') || (await req.json().catch(() => ({}))).train_number;

    if (!trainNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing train_number parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Check cache in train_routes (< 24 hours old)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from('train_routes')
      .select('route_geojson, fetched_at')
      .eq('train_number', trainNumber)
      .gt('fetched_at', twentyFourHoursAgo)
      .single();

    if (cached && cached.route_geojson) {
      return new Response(
        JSON.stringify({ source: 'cache', route: cached.route_geojson }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Fetch on-demand from RailRadar if API key is present
    if (RAILRADAR_API_KEY) {
      const resp = await fetch(https://railradar.in/api/v1/trains//route, {
        headers: {
          'Authorization': Bearer ,
          'Accept': 'application/json',
        },
      });

      if (resp.ok) {
        const routeData = await resp.json();
        const geojson = routeData.route_geojson || routeData;

        // Cache into train_routes
        await supabase.from('train_routes').upsert({
          train_number: trainNumber,
          route_geojson: geojson,
          fetched_at: new Date().toISOString(),
        });

        return new Response(
          JSON.stringify({ source: 'live', route: geojson }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 3. Fallback: return any older cache if available
    const { data: fallback } = await supabase
      .from('train_routes')
      .select('route_geojson')
      .eq('train_number', trainNumber)
      .single();

    if (fallback && fallback.route_geojson) {
      return new Response(
        JSON.stringify({ source: 'stale_cache', route: fallback.route_geojson }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Route geometry not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
