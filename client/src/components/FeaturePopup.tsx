import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";

interface FeaturePopupProps {
  map: maplibregl.Map | null;
  feature: GeoJSON.Feature | null;
  lngLat: maplibregl.LngLat | null;
  onClose: () => void;
}

export function FeaturePopup({
  map,
  feature,
  lngLat,
  onClose,
}: FeaturePopupProps) {
  const popupRef = useRef<maplibregl.Popup | null>(null);

  useEffect(() => {
    if (!map || !feature || !lngLat) {
      popupRef.current?.remove();
      popupRef.current = null;
      return;
    }

    const properties = feature.properties || {};
    const entries = Object.entries(properties).filter(
      ([, value]) => value !== null && value !== undefined && value !== ""
    );

    const html = `
      <div style="max-height: 300px; overflow-y: auto;">
        <table style="border-collapse: collapse; font-size: 12px;">
          ${entries
            .map(
              ([key, value]) => `
            <tr>
              <td style="padding: 4px 8px; border-bottom: 1px solid #eee; font-weight: 600; vertical-align: top;">${key}</td>
              <td style="padding: 4px 8px; border-bottom: 1px solid #eee; max-width: 200px; word-wrap: break-word;">${value}</td>
            </tr>
          `
            )
            .join("")}
        </table>
      </div>
    `;

    popupRef.current = new maplibregl.Popup({ closeOnClick: false })
      .setLngLat(lngLat)
      .setHTML(html)
      .addTo(map);

    popupRef.current.on("close", onClose);

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
    };
  }, [map, feature, lngLat, onClose]);

  return null;
}
