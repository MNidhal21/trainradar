import { TrainLive, TrainRouteGeoJSON } from '../types/train';

const RAILRADAR_API_KEY = 'rg_1ce6e81d9a40479fb185868025525c3b';
const BASE_URL = 'https://railradar.in/api/v1';

const routeCache = new Map<string, TrainRouteGeoJSON>();

/**
 * Fetch detailed route stations and convert to GeoJSON LineStrings
 * (Traveled up to current station vs Remaining to destination)
 */
export async function fetchLiveTrainFromRailRadar(trainNumber: string): Promise<{
  train: Partial<TrainLive>;
  route: TrainRouteGeoJSON;
} | null> {
  // Check in-memory cache first to conserve API budget
  const cachedRoute = routeCache.get(trainNumber);
  if (cachedRoute) {
    return { train: {}, route: cachedRoute };
  }

  try {
    const [trainInfoRes, liveStatusRes] = await Promise.all([
      fetch(`${BASE_URL}/trains/${trainNumber}`, {
        headers: {
          'Authorization': `Bearer ${RAILRADAR_API_KEY}`,
          'Accept': 'application/json',
        },
      }),
      fetch(`${BASE_URL}/trains/${trainNumber}/live`, {
        headers: {
          'Authorization': `Bearer ${RAILRADAR_API_KEY}`,
          'Accept': 'application/json',
        },
      }).catch(() => null),
    ]);

    if (!trainInfoRes.ok) return null;

    const trainData = await trainInfoRes.json();
    const schedule = trainData?.data?.schedule || [];

    if (schedule.length < 2) return null;

    // Extract station coordinates with valid lat/lng
    const stationsWithCoords = schedule.filter(
      (s: any) => s.station && s.station.lat && s.station.lng
    );

    if (stationsWithCoords.length < 2) return null;

    // Get live status if available to determine split point
    let liveData: any = null;
    if (liveStatusRes && liveStatusRes.ok) {
      liveData = await liveStatusRes.json();
    }

    const liveStations = liveData?.data?.stations || [];
    const lastPassedIndex = liveStations.findLastIndex((s: any) => s.status === 'passed');
    const splitIndex = lastPassedIndex >= 0 
      ? Math.min(lastPassedIndex + 1, stationsWithCoords.length - 1)
      : Math.floor(stationsWithCoords.length * 0.4);

    const allCoords: [number, number][] = stationsWithCoords.map((s: any) => [
      Number(s.station.lng),
      Number(s.station.lat),
    ]);

    const traveledCoords = allCoords.slice(0, splitIndex + 1);
    const remainingCoords = allCoords.slice(splitIndex);

    const currentStation = stationsWithCoords[splitIndex]?.station;
    const nextStation = stationsWithCoords[Math.min(splitIndex + 1, stationsWithCoords.length - 1)]?.station;
    const totalDist = stationsWithCoords[stationsWithCoords.length - 1]?.distance || 1000;
    const coveredDist = stationsWithCoords[splitIndex]?.distance || (totalDist * 0.4);

    const routeGeoJSON: TrainRouteGeoJSON = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { segment: 'traveled' },
          geometry: {
            type: 'LineString',
            coordinates: traveledCoords.length >= 2 ? traveledCoords : allCoords.slice(0, 2),
          },
        },
        {
          type: 'Feature',
          properties: { segment: 'remaining' },
          geometry: {
            type: 'LineString',
            coordinates: remainingCoords.length >= 2 ? remainingCoords : allCoords.slice(-2),
          },
        },
      ],
    };

    routeCache.set(trainNumber, routeGeoJSON);

    const liveStats = liveStations[splitIndex] || {};
    const delay = Number(liveStats.delayArrival || 0);

    return {
      train: {
        train_number: trainNumber,
        train_name: trainData?.data?.trainName || trainData?.data?.name || `Train ${trainNumber}`,
        current_lat: currentStation?.lat || stationsWithCoords[0].station.lat,
        current_lng: currentStation?.lng || stationsWithCoords[0].station.lng,
        next_station_code: nextStation?.code || '',
        next_station_name: nextStation?.name || '',
        distance_covered_km: Math.round(coveredDist),
        total_distance_km: Math.round(totalDist),
        delay_minutes: delay,
        status: delay > 15 ? 'DELAYED' : 'RUNNING',
      },
      route: routeGeoJSON,
    };
  } catch (err) {
    console.warn('RailRadar live fetch error:', err);
    return null;
  }
}
