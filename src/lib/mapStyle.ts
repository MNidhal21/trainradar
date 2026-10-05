import { StyleSpecification } from 'maplibre-gl';

/**
 * Custom dark night-sky map style for India
 * Adheres to PRD Section 10 design tokens:
 * --bg-primary: #0A0F1E
 * --map-landmass: #16233A
 * --route-traveled: #F2A64A
 * --route-remaining: #7FC7F0
 */
export const DARK_MAP_STYLE: StyleSpecification = {
  version: 8,
  name: 'TrainRadar Dark Matter',
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
      attribution: '&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors &copy; <a href=\"https://carto.com/attributions\">CARTO</a>',
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#0A0F1E',
      },
    },
    {
      id: 'carto-dark-layer',
      type: 'raster',
      source: 'carto-dark',
      paint: {
        'raster-opacity': 0.92,
        'raster-contrast': 0.1,
        'raster-saturation': -0.15,
      },
    },
  ],
};
