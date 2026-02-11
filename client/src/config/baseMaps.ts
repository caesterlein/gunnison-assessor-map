export type BaseMapType = 'street' | 'satellite' | 'terrain';

export interface BaseMapConfig {
  id: BaseMapType;
  name: string;
  sourceId: string;  // MapLibre source ID
  layerId: string;    // MapLibre layer ID
  source: {
    type: 'raster';
    tiles: string[];
    tileSize: 256;
    attribution?: string;
  };
}

export const BASE_MAPS: Record<BaseMapType, BaseMapConfig> = {
  street: {
    id: 'street',
    name: 'Street',
    sourceId: 'osm',  // Reuse existing source ID
    layerId: 'osm',   // Reuse existing layer ID
    source: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    sourceId: 'satellite',
    layerId: 'satellite',
    source: {
      type: 'raster',
      tiles: ['https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: '© Esri',
    },
  },
  terrain: {
    id: 'terrain',
    name: 'Terrain',
    sourceId: 'terrain',
    layerId: 'terrain',
    source: {
      type: 'raster',
      tiles: [
        'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenTopoMap contributors',
    },
  },
};
