import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { FIELD_LABELS } from "../config/fieldLabels";

interface FeaturePopupProps {
  map: maplibregl.Map | null;
  feature: GeoJSON.Feature | null;
  lngLat: maplibregl.LngLat | null;
  layerId: string;
  onClose: () => void;
}

/**
 * Extract base layer ID from MapLibre layer ID
 * e.g., "road-line" -> "road", "taxparcelassessor-fill" -> "taxparcelassessor"
 */
function getBaseLayerId(layerId: string): string {
  // Remove common suffixes: -circle, -line, -fill, -outline
  return layerId.replace(/-circle$|-line$|-fill$|-outline$/, "");
}

/**
 * Get human-readable label for a field, falling back to raw field name if no mapping exists
 */
function getFieldLabel(layerId: string, fieldName: string): string {
  const baseLayerId = getBaseLayerId(layerId);
  const layerLabels = FIELD_LABELS[baseLayerId];
  return layerLabels?.[fieldName] || fieldName;
}

export function FeaturePopup({
  map,
  feature,
  lngLat,
  layerId,
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
              ([key, value]) => {
                const label = getFieldLabel(layerId, key);
                return `
            <tr>
              <td style="padding: 4px 8px; border-bottom: 1px solid #eee; font-weight: 600; vertical-align: top;">${escapeHtml(label)}</td>
              <td style="padding: 4px 8px; border-bottom: 1px solid #eee; max-width: 200px; word-wrap: break-word;">${escapeHtml(String(value))}</td>
            </tr>
          `;
              }
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
  }, [map, feature, lngLat, layerId, onClose]);

  return null;
}

/**
 * Escape HTML to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
