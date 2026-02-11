import { useEffect, useState } from 'react';
import type { Map } from 'maplibre-gl';

interface ScaleControlProps {
  map: Map | null;
  unit?: 'imperial' | 'metric';
}

export function ScaleControl({ map, unit = 'imperial' }: ScaleControlProps) {
  const [scale, setScale] = useState<string>('');

  useEffect(() => {
    if (!map) return;

    const updateScale = () => {
      const bounds = map.getBounds();
      const centerLat = bounds.getCenter().lat;
      const metersPerPixel = (156543.03392 * Math.cos((centerLat * Math.PI) / 180)) / Math.pow(2, map.getZoom());
      const dimension = map.getContainer().getBoundingClientRect();
      const meters = metersPerPixel * dimension.width;

      let scaleText: string;
      if (unit === 'imperial') {
        const miles = meters / 1609.34;
        if (miles >= 1) {
          scaleText = `${miles.toFixed(1)} mi`;
        } else {
          const feet = meters * 3.28084;
          scaleText = `${Math.round(feet)} ft`;
        }
      } else {
        const km = meters / 1000;
        if (km >= 1) {
          scaleText = `${km.toFixed(1)} km`;
        } else {
          scaleText = `${Math.round(meters)} m`;
        }
      }

      setScale(scaleText);
    };

    updateScale();
    map.on('move', updateScale);
    map.on('zoom', updateScale);
    map.on('resize', updateScale);

    return () => {
      map.off('move', updateScale);
      map.off('zoom', updateScale);
      map.off('resize', updateScale);
    };
  }, [map, unit]);

  if (!map || !scale) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'sans-serif',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      {scale}
    </div>
  );
}
