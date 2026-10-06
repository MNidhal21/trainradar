import { TrainLive, TrainRouteGeoJSON } from '../types/train';

export interface RouteGeometry {
  traveled: [number, number][];
  remaining: [number, number][];
}

let routesCache: Record<string, RouteGeometry> | null = null;
let routesLoadingPromise: Promise<Record<string, RouteGeometry>> | null = null;

interface TrainTrackState {
  fullTrack: [number, number][];
  cumulativeDistances: number[];
  totalDistanceKm: number;
  currentDistKm: number;
  speedKmh: number;
}

const trainTrackStates = new Map<string, TrainTrackState>();

function getSegmentDistanceKm(p1: [number, number], p2: [number, number]): number {
  const dLng = (p2[0] - p1[0]) * Math.cos(((p1[1] + p2[1]) * Math.PI) / 360);
  const dLat = p2[1] - p1[1];
  return Math.sqrt(dLng * dLng + dLat * dLat) * 111.32;
}

export function calculateTrackBearing(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(rLat2);
  const x = Math.cos(rLat1) * Math.sin(rLat2) - Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLng);
  return Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
}

export async function loadRoutesMap(): Promise<Record<string, RouteGeometry>> {
  if (routesCache) return routesCache;
  if (routesLoadingPromise) return routesLoadingPromise;

  routesLoadingPromise = (async () => {
    try {
      const res = await fetch('./data/train_routes_map.json');
      if (res.ok) {
        routesCache = await res.json();
        return routesCache!;
      }
    } catch (e) {
      console.warn('Failed to load train_routes_map.json:', e);
    }
    return {};
  })();

  return routesLoadingPromise;
}

function getOrInitTrackState(train: TrainLive, routesMap: Record<string, RouteGeometry>): TrainTrackState | null {
  let state = trainTrackStates.get(train.train_number);
  const routeData = routesMap[train.train_number];

  // Re-initialize if previously only had dummy 2-point fallback
  if (state && state.fullTrack.length <= 2 && routeData && routeData.traveled?.length >= 2) {
    state = undefined;
  }
  if (state) return state;

  let fullTrack: [number, number][];
  if (routeData && routeData.traveled && routeData.remaining) {
    fullTrack = [...routeData.traveled.slice(0, -1), ...routeData.remaining];
  } else {
    fullTrack = [
      [train.current_lng, train.current_lat],
      [train.next_lng || train.current_lng + 0.1, train.next_lat || train.current_lat + 0.1],
    ];
  }

  if (fullTrack.length < 2) return null;

  const cumulativeDistances: number[] = [0];
  let runningDist = 0;
  for (let i = 1; i < fullTrack.length; i++) {
    const d = getSegmentDistanceKm(fullTrack[i - 1], fullTrack[i]);
    runningDist += Math.max(d, 0.01);
    cumulativeDistances.push(runningDist);
  }

  const totalDistanceKm = runningDist > 0 ? runningDist : Number(train.total_distance_km || 500);

  const progressRatio = train.total_distance_km > 0
    ? Math.min(Math.max(train.distance_covered_km / train.total_distance_km, 0.05), 0.95)
    : 0.45;

  const currentDistKm = progressRatio * totalDistanceKm;

  let speed = 90;
  if (train.train_type === 'Vande Bharat') speed = 130;
  else if (train.train_type === 'Rajdhani') speed = 120;
  else if (train.train_type === 'Shatabdi') speed = 110;
  else if (train.train_type === 'Duronto') speed = 115;
  else if (train.train_type === 'Superfast') speed = 95;
  else if (train.status === 'DELAYED') speed = 75;

  state = {
    fullTrack,
    cumulativeDistances,
    totalDistanceKm,
    currentDistKm,
    speedKmh: speed,
  };

  trainTrackStates.set(train.train_number, state);
  return state;
}

export function stepTrainsOnTrack(
  trains: TrainLive[],
  routesMap: Record<string, RouteGeometry>,
  deltaSeconds: number
): TrainLive[] {
  return trains.map((train) => {
    if (train.status !== 'RUNNING' && train.status !== 'DELAYED') {
      return train;
    }

    const state = getOrInitTrackState(train, routesMap);
    if (!state) return train;

    const distDelta = (state.speedKmh * deltaSeconds) / 3600;
    state.currentDistKm += distDelta;

    if (state.currentDistKm >= state.totalDistanceKm) {
      state.currentDistKm = 0;
    }

    const targetDist = state.currentDistKm;
    const { fullTrack, cumulativeDistances } = state;

    let segIdx = 0;
    for (let i = 0; i < cumulativeDistances.length - 1; i++) {
      if (targetDist >= cumulativeDistances[i] && targetDist <= cumulativeDistances[i + 1]) {
        segIdx = i;
        break;
      }
    }

    const p1 = fullTrack[segIdx];
    const p2 = fullTrack[segIdx + 1] || p1;

    const segStartDist = cumulativeDistances[segIdx];
    const segEndDist = cumulativeDistances[segIdx + 1] || segStartDist + 0.01;
    const segLen = Math.max(segEndDist - segStartDist, 0.001);

    const segmentFraction = Math.max(0, Math.min(1, (targetDist - segStartDist) / segLen));

    const curLng = p1[0] + segmentFraction * (p2[0] - p1[0]);
    const curLat = p1[1] + segmentFraction * (p2[1] - p1[1]);
    const bearing = calculateTrackBearing(p1[0], p1[1], p2[0], p2[1]);

    return {
      ...train,
      current_lng: curLng,
      current_lat: curLat,
      bearing_degrees: bearing,
      distance_covered_km: Math.round(targetDist),
      last_updated_at: new Date().toISOString(),
    };
  });
}

/**
 * Returns instantaneous traveled route (blue) and remaining route on the actual track
 */
export function getRouteForSelectedTrain(
  train: TrainLive,
  routesMap: Record<string, RouteGeometry>
): TrainRouteGeoJSON | null {
  const curPos: [number, number] = [train.current_lng, train.current_lat];
  const routeData = routesMap[train.train_number];

  if (routeData && Array.isArray(routeData.traveled) && routeData.traveled.length >= 2) {
    const traveled = [...routeData.traveled.slice(0, -1), curPos];
    const remaining = [curPos, ...(routeData.remaining || []).slice(1)];

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { segment: 'traveled' },
          geometry: {
            type: 'LineString',
            coordinates: traveled,
          },
        },
        {
          type: 'Feature',
          properties: { segment: 'remaining' },
          geometry: {
            type: 'LineString',
            coordinates: remaining.length >= 2 ? remaining : [curPos, curPos],
          },
        },
      ],
    };
  }

  // Fallback to active state
  const state = getOrInitTrackState(train, routesMap);
  if (!state) return null;

  const { fullTrack, cumulativeDistances, currentDistKm } = state;

  let segIdx = 0;
  for (let i = 0; i < cumulativeDistances.length - 1; i++) {
    if (currentDistKm >= cumulativeDistances[i] && currentDistKm <= cumulativeDistances[i + 1]) {
      segIdx = i;
      break;
    }
  }

  const traveledCoords: [number, number][] = [
    ...fullTrack.slice(0, segIdx + 1),
    curPos,
  ];

  const remainingCoords: [number, number][] = [
    curPos,
    ...fullTrack.slice(segIdx + 1),
  ];

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { segment: 'traveled' },
        geometry: {
          type: 'LineString',
          coordinates: traveledCoords.length >= 2 ? traveledCoords : [fullTrack[0], curPos],
        },
      },
      {
        type: 'Feature',
        properties: { segment: 'remaining' },
        geometry: {
          type: 'LineString',
          coordinates: remainingCoords.length >= 2 ? remainingCoords : [curPos, fullTrack[fullTrack.length - 1]],
        },
      },
    ],
  };
}
