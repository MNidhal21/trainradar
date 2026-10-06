const fs = require('fs');

console.log('1. Updating railway_stations.json with Kashmir stations...');
const stationsPath = 'public/data/railway_stations.json';
const stations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));

const kashmirStations = [
  { code: 'BRML', name: 'BARAMULLA', state: 'Jammu & Kashmir', zone: 'NR', coords: [74.3312, 34.2085] },
  { code: 'SXZM', name: 'SOPORE', state: 'Jammu & Kashmir', zone: 'NR', coords: [74.4533, 34.2798] },
  { code: 'HME', name: 'HAMRE', state: 'Jammu & Kashmir', zone: 'NR', coords: [74.5241, 34.2384] },
  { code: 'PTTN', name: 'PATTAN', state: 'Jammu & Kashmir', zone: 'NR', coords: [74.5824, 34.1625] },
  { code: 'MZMA', name: 'MAZHOM', state: 'Jammu & Kashmir', zone: 'NR', coords: [74.6542, 34.1082] },
  { code: 'BDGM', name: 'BUDGAM', state: 'Jammu & Kashmir', zone: 'NR', coords: [74.7438, 34.0215] },
  { code: 'SINA', name: 'SRINAGAR', state: 'Jammu & Kashmir', zone: 'NR', coords: [74.8322, 34.0326] },
  { code: 'PMPE', name: 'PAMPORE', state: 'Jammu & Kashmir', zone: 'NR', coords: [74.8967, 34.0041] },
  { code: 'KAPE', name: 'KAKAPORA', state: 'Jammu & Kashmir', zone: 'NR', coords: [74.9288, 33.9572] },
  { code: 'ATPA', name: 'AWANTIPORA', state: 'Jammu & Kashmir', zone: 'NR', coords: [75.0112, 33.9184] },
  { code: 'PJGM', name: 'PANZGAM', state: 'Jammu & Kashmir', zone: 'NR', coords: [75.0567, 33.8542] },
  { code: 'BJBA', name: 'BIJBIARA', state: 'Jammu & Kashmir', zone: 'NR', coords: [75.0978, 33.7954] },
  { code: 'ANT', name: 'ANANTNAG', state: 'Jammu & Kashmir', zone: 'NR', coords: [75.1278, 33.7385] },
  { code: 'SDUA', name: 'SADURA', state: 'Jammu & Kashmir', zone: 'NR', coords: [75.1489, 33.6821] },
  { code: 'QG', name: 'QAZIGUND', state: 'Jammu & Kashmir', zone: 'NR', coords: [75.1724, 33.5932] },
  { code: 'BAHL', name: 'BANIHAL', state: 'Jammu & Kashmir', zone: 'NR', coords: [75.1956, 33.5042] },
  { code: 'KHARI', name: 'KHARI', state: 'Jammu & Kashmir', zone: 'NR', coords: [75.1523, 33.3984] },
  { code: 'SMBR', name: 'SUMBER', state: 'Jammu & Kashmir', zone: 'NR', coords: [75.0921, 33.3214] },
  { code: 'SGDN', name: 'SANGALDAN', state: 'Jammu & Kashmir', zone: 'NR', coords: [75.0215, 33.2564] },
  { code: 'REASI', name: 'REASI CHENAB BRIDGE', state: 'Jammu & Kashmir', zone: 'NR', coords: [74.8872, 33.0912] },
  { code: 'SVDK', name: 'SMVD KATRA', state: 'Jammu & Kashmir', zone: 'NR', coords: [74.9357, 32.9828] }
];

const existingCodes = new Set(stations.features.map(f => f.properties.code));
let addedStations = 0;
for (const s of kashmirStations) {
  if (!existingCodes.has(s.code)) {
    stations.features.push({
      type: 'Feature',
      properties: {
        code: s.code,
        name: s.name,
        state: s.state,
        zone: s.zone,
        address: s.name + ', ' + s.state
      },
      geometry: {
        type: 'Point',
        coordinates: s.coords
      }
    });
    addedStations++;
  }
}
fs.writeFileSync(stationsPath, JSON.stringify(stations), 'utf8');
console.log('Added ' + addedStations + ' Kashmir stations! Total stations: ' + stations.features.length);

console.log('2. Updating railway_tracks.json with Kashmir Valley track...');
const tracksPath = 'public/data/railway_tracks.json';
const tracks = JSON.parse(fs.readFileSync(tracksPath, 'utf8'));

// Track coordinates polyline from Baramulla through Srinagar, Banihal, Katra, Udhampur to Jammu
const kashmirTrackCoords = [
  [74.3312, 34.2085], // Baramulla
  [74.3850, 34.2410],
  [74.4533, 34.2798], // Sopore
  [74.4890, 34.2610],
  [74.5241, 34.2384], // Hamre
  [74.5510, 34.1980],
  [74.5824, 34.1625], // Pattan
  [74.6180, 34.1350],
  [74.6542, 34.1082], // Mazhom
  [74.7010, 34.0650],
  [74.7438, 34.0215], // Budgam
  [74.7890, 34.0250],
  [74.8322, 34.0326], // SRINAGAR
  [74.8650, 34.0180],
  [74.8967, 34.0041], // Pampore
  [74.9120, 33.9810],
  [74.9288, 33.9572], // Kakapora
  [74.9680, 33.9390],
  [75.0112, 33.9184], // Awantipora
  [75.0340, 33.8860],
  [75.0567, 33.8542], // Panzgam
  [75.0780, 33.8250],
  [75.0978, 33.7954], // Bijbiara
  [75.1120, 33.7680],
  [75.1278, 33.7385], // Anantnag
  [75.1390, 33.7100],
  [75.1489, 33.6821], // Sadura
  [75.1610, 33.6370],
  [75.1724, 33.5932], // Qazigund
  [75.1840, 33.5480], // Pir Panjal Tunnel
  [75.1956, 33.5042], // Banihal
  [75.1740, 33.4510],
  [75.1523, 33.3984], // Khari
  [75.1220, 33.3590],
  [75.0921, 33.3214], // Sumber
  [75.0560, 33.2880],
  [75.0215, 33.2564], // Sangaldan
  [74.9890, 33.2260],
  [74.9654, 33.1954], // Sawalkote
  [74.9260, 33.1430],
  [74.8872, 33.0912], // Reasi (Chenab Rail Bridge)
  [74.9110, 33.0360],
  [74.9357, 32.9828], // Katra
  [75.0450, 32.9550],
  [75.1548, 32.9266], // Udhampur
  [75.0170, 32.8160], // Manwal
  [74.8801, 32.7069]  // Jammu Tawi
];

// Check if kashmir-usbrl already exists
if (!tracks.features.some(f => f.properties && f.properties.id === 'kashmir-usbrl')) {
  tracks.features.push({
    type: 'Feature',
    properties: { id: 'kashmir-usbrl', name: 'Udhampur-Srinagar-Baramulla Rail Link' },
    geometry: {
      type: 'LineString',
      coordinates: kashmirTrackCoords
    }
  });
  fs.writeFileSync(tracksPath, JSON.stringify(tracks), 'utf8');
  console.log('Added Kashmir USBRL tracks to railway_tracks.json!');
}

console.log('3. Adding active Kashmir trains & routes...');
const activeTrainsPath = 'public/data/active_trains.json';
const routesMapPath = 'public/data/train_routes_map.json';

const activeTrains = JSON.parse(fs.readFileSync(activeTrainsPath, 'utf8'));
const routesMap = JSON.parse(fs.readFileSync(routesMapPath, 'utf8'));

const kashmirTrains = [
  {
    train_number: '04617',
    train_name: 'Banihal - Baramulla Special',
    train_type: 'DEMU',
    current_lat: 34.0326, // at Srinagar station
    current_lng: 74.8322,
    from_station_code: 'BAHL',
    from_station_name: 'BANIHAL',
    to_station_code: 'BRML',
    to_station_name: 'BARAMULLA',
    departure_time: '07:15',
    arrival_time: '10:05',
    duration_h: 2,
    duration_m: 50,
    next_station_code: 'BDGM',
    next_station_name: 'BUDGAM',
    distance_covered_km: 78,
    total_distance_km: 138,
    delay_minutes: 0,
    bearing_degrees: 315,
    status: 'RUNNING',
    last_updated_at: new Date().toISOString()
  },
  {
    train_number: '04618',
    train_name: 'Baramulla - Banihal Special',
    train_type: 'DEMU',
    current_lat: 33.7385, // near Anantnag
    current_lng: 75.1278,
    from_station_code: 'BRML',
    from_station_name: 'BARAMULLA',
    to_station_code: 'BAHL',
    to_station_name: 'BANIHAL',
    departure_time: '14:20',
    arrival_time: '17:10',
    duration_h: 2,
    duration_m: 50,
    next_station_code: 'QG',
    next_station_name: 'QAZIGUND',
    distance_covered_km: 102,
    total_distance_km: 138,
    delay_minutes: 5,
    bearing_degrees: 145,
    status: 'RUNNING',
    last_updated_at: new Date().toISOString()
  },
  {
    train_number: '04621',
    train_name: 'Budgam - Srinagar - Banihal DEMU',
    train_type: 'DEMU',
    current_lat: 33.9572, // at Kakapora
    current_lng: 74.9288,
    from_station_code: 'BDGM',
    from_station_name: 'BUDGAM',
    to_station_code: 'BAHL',
    to_station_name: 'BANIHAL',
    departure_time: '08:45',
    arrival_time: '10:40',
    duration_h: 1,
    duration_m: 55,
    next_station_code: 'ATPA',
    next_station_name: 'AWANTIPORA',
    distance_covered_km: 42,
    total_distance_km: 98,
    delay_minutes: 0,
    bearing_degrees: 130,
    status: 'RUNNING',
    last_updated_at: new Date().toISOString()
  },
  {
    train_number: '22439',
    train_name: 'Vande Bharat Express (New Delhi - Katra)',
    train_type: 'Vande Bharat',
    current_lat: 32.9828, // at Katra
    current_lng: 74.9357,
    from_station_code: 'NDLS',
    from_station_name: 'NEW DELHI',
    to_station_code: 'SVDK',
    to_station_name: 'SMVD KATRA',
    departure_time: '06:00',
    arrival_time: '14:00',
    duration_h: 8,
    duration_m: 0,
    next_station_code: 'SVDK',
    next_station_name: 'SMVD KATRA',
    distance_covered_km: 650,
    total_distance_km: 655,
    delay_minutes: 0,
    bearing_degrees: 340,
    status: 'RUNNING',
    last_updated_at: new Date().toISOString()
  }
];

// Add trains and corresponding route geometries
for (const kt of kashmirTrains) {
  const existingIdx = activeTrains.findIndex(t => t.train_number === kt.train_number);
  if (existingIdx >= 0) {
    activeTrains[existingIdx] = kt;
  } else {
    activeTrains.push(kt);
  }

  // Construct traveled & remaining line from track coords
  // For 04617 (Banihal to Baramulla, currently at Srinagar)
  if (kt.train_number === '04617') {
    const srinagarIdx = kashmirTrackCoords.findIndex(c => c[0] === 74.8322 && c[1] === 34.0326);
    // traveled: Banihal (idx 30) to Srinagar (idx 12)
    const reversed = [...kashmirTrackCoords].reverse();
    const banihalIdxRev = reversed.findIndex(c => c[0] === 75.1956);
    const srinagarIdxRev = reversed.findIndex(c => c[0] === 74.8322);
    routesMap[kt.train_number] = {
      traveled: reversed.slice(banihalIdxRev, srinagarIdxRev + 1),
      remaining: reversed.slice(srinagarIdxRev)
    };
  } else if (kt.train_number === '04618') {
    const anantnagIdx = kashmirTrackCoords.findIndex(c => c[0] === 75.1278 && c[1] === 33.7385);
    routesMap[kt.train_number] = {
      traveled: kashmirTrackCoords.slice(0, anantnagIdx + 1),
      remaining: kashmirTrackCoords.slice(anantnagIdx)
    };
  } else {
    const midIdx = Math.floor(kashmirTrackCoords.length / 2);
    routesMap[kt.train_number] = {
      traveled: kashmirTrackCoords.slice(0, midIdx + 1),
      remaining: kashmirTrackCoords.slice(midIdx)
    };
  }
}

fs.writeFileSync(activeTrainsPath, JSON.stringify(activeTrains), 'utf8');
fs.writeFileSync(routesMapPath, JSON.stringify(routesMap), 'utf8');
console.log('Successfully saved ' + activeTrains.length + ' active trains and route geometries including Kashmir Valley!');
