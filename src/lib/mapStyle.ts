/**
 * Refined Map Style for TrainRadar (PRD Section 4 & 10)
 * OpenFreeMap vector dark style brightened with balanced contrast (no pitch black void).
 */
export const DARK_MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';

/**
 * Apply contrast & brightness boosts to OpenFreeMap layers once loaded
 */
export function applyMapBrightness(map: any) {
  try {
    if (map.getLayer('background')) {
      map.setPaintProperty('background', 'background-color', '#18202e');
    }
    if (map.getLayer('water')) {
      map.setPaintProperty('water', 'fill-color', '#0c1322');
    }
    if (map.getLayer('boundary_state')) {
      map.setPaintProperty('boundary_state', 'line-color', '#64748b');
      map.setPaintProperty('boundary_state', 'line-opacity', 0.9);
      map.setPaintProperty('boundary_state', 'line-width', 1.2);
    }
    if (map.getLayer('boundary_country_z0-4')) {
      map.setPaintProperty('boundary_country_z0-4', 'line-color', '#94a3b8');
      map.setPaintProperty('boundary_country_z0-4', 'line-opacity', 1.0);
    }
    if (map.getLayer('boundary_country_z5-')) {
      map.setPaintProperty('boundary_country_z5-', 'line-color', '#94a3b8');
      map.setPaintProperty('boundary_country_z5-', 'line-opacity', 1.0);
    }
  } catch (err) {
    console.warn('Could not adjust map layer brightness:', err);
  }
}
