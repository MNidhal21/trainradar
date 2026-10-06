/**
 * Map Styles for TrainRadar
 * Default: Balanced Brightened Slate Navy (never pitch black)
 * Optional: Daylight High-Contrast Positron
 */
export const DARK_MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';
export const LIGHT_MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

/**
 * Apply contrast & brightness boosts to layers once loaded so the map is never too dark
 */
export function applyMapBrightness(map: any) {
  try {
    if (map.getLayer('background')) {
      map.setPaintProperty('background', 'background-color', '#202b3d');
    }
    if (map.getLayer('water')) {
      map.setPaintProperty('water', 'fill-color', '#0f1828');
    }
    if (map.getLayer('landuse_residential')) {
      map.setPaintProperty('landuse_residential', 'fill-color', '#28364d');
      map.setPaintProperty('landuse_residential', 'fill-opacity', 0.5);
    }
    if (map.getLayer('boundary_state')) {
      map.setPaintProperty('boundary_state', 'line-color', '#94a3b8');
      map.setPaintProperty('boundary_state', 'line-opacity', 0.95);
      map.setPaintProperty('boundary_state', 'line-width', 1.5);
    }
    if (map.getLayer('boundary_country_z0-4')) {
      map.setPaintProperty('boundary_country_z0-4', 'line-color', '#cbd5e1');
      map.setPaintProperty('boundary_country_z0-4', 'line-opacity', 1.0);
      map.setPaintProperty('boundary_country_z0-4', 'line-width', 2.0);
    }
    if (map.getLayer('boundary_country_z5-')) {
      map.setPaintProperty('boundary_country_z5-', 'line-color', '#cbd5e1');
      map.setPaintProperty('boundary_country_z5-', 'line-opacity', 1.0);
      map.setPaintProperty('boundary_country_z5-', 'line-width', 2.0);
    }
  } catch (err) {
    console.warn('Could not adjust map layer brightness:', err);
  }
}
