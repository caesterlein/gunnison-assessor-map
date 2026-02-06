import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LAYERS, TIPG_URL } from "../config/layers";
import type { LayerConfig } from "../config/layers";
import { FeaturePopup } from "./FeaturePopup";

const GUNNISON_CENTER: [number, number] = [-106.9, 38.6];

interface MapProps {
  enabledLayers: Set<string>;
}

interface SelectedFeature {
  feature: GeoJSON.Feature;
  lngLat: maplibregl.LngLat;
}

function getLayerIds(layer: LayerConfig): string[] {
  switch (layer.geometryType) {
    case "Point":
      return [`${layer.id}-circle`];
    case "LineString":
      return [`${layer.id}-line`];
    case "Polygon":
      return [`${layer.id}-fill`, `${layer.id}-outline`];
  }
}

function addLayerToMap(map: maplibregl.Map, layer: LayerConfig) {
  if (map.getSource(layer.id)) return;

  map.addSource(layer.id, {
    type: "vector",
    tiles: [`${TIPG_URL}/collections/gunnison.${layer.id}/tiles/WebMercatorQuad/{z}/{x}/{y}`],
  });

  switch (layer.geometryType) {
    case "Point":
      map.addLayer({
        id: `${layer.id}-circle`,
        type: "circle",
        source: layer.id,
        "source-layer": "default",
        paint: {
          "circle-color": layer.color,
          "circle-radius": 6,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 1,
        },
      });
      break;
    case "LineString":
      map.addLayer({
        id: `${layer.id}-line`,
        type: "line",
        source: layer.id,
        "source-layer": "default",
        paint: {
          "line-color": layer.color,
          "line-width": 2,
        },
      });
      break;
    case "Polygon":
      map.addLayer({
        id: `${layer.id}-fill`,
        type: "fill",
        source: layer.id,
        "source-layer": "default",
        paint: {
          "fill-color": layer.color,
          "fill-opacity": 0.3,
        },
      });
      map.addLayer({
        id: `${layer.id}-outline`,
        type: "line",
        source: layer.id,
        "source-layer": "default",
        paint: {
          "line-color": layer.color,
          "line-width": 1,
        },
      });
      break;
  }
}

function removeLayerFromMap(map: maplibregl.Map, layer: LayerConfig) {
  const layerIds = getLayerIds(layer);
  layerIds.forEach((id) => {
    if (map.getLayer(id)) {
      map.removeLayer(id);
    }
  });
  if (map.getSource(layer.id)) {
    map.removeSource(layer.id);
  }
}

export function Map({ enabledLayers }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [selectedFeature, setSelectedFeature] =
    useState<SelectedFeature | null>(null);

  const handlePopupClose = useCallback(() => {
    setSelectedFeature(null);
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current) return;

    const newMap = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: GUNNISON_CENTER,
      zoom: 9,
    });

    newMap.addControl(new maplibregl.NavigationControl());

    newMap.on("load", () => {
      setMap(newMap);
    });

    return () => {
      newMap.remove();
    };
  }, []);

  // Sync enabled layers
  useEffect(() => {
    if (!map) return;

    LAYERS.forEach((layer) => {
      const isEnabled = enabledLayers.has(layer.id);
      const sourceExists = map.getSource(layer.id);

      if (isEnabled && !sourceExists) {
        addLayerToMap(map, layer);
      } else if (!isEnabled && sourceExists) {
        removeLayerFromMap(map, layer);
      }
    });
  }, [enabledLayers, map]);

  // Click and hover handlers
  useEffect(() => {
    if (!map) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const allLayerIds = LAYERS.filter((l) => enabledLayers.has(l.id)).flatMap(
        getLayerIds
      );

      const existingLayerIds = allLayerIds.filter((id) => map.getLayer(id));
      if (existingLayerIds.length === 0) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: existingLayerIds,
      });

      if (features.length > 0) {
        setSelectedFeature({
          feature: features[0] as GeoJSON.Feature,
          lngLat: e.lngLat,
        });
      }
    };

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      const allLayerIds = LAYERS.filter((l) => enabledLayers.has(l.id)).flatMap(
        getLayerIds
      );

      const existingLayerIds = allLayerIds.filter((id) => map.getLayer(id));
      if (existingLayerIds.length === 0) {
        map.getCanvas().style.cursor = "";
        return;
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: existingLayerIds,
      });

      map.getCanvas().style.cursor = features.length > 0 ? "pointer" : "";
    };

    map.on("click", handleClick);
    map.on("mousemove", handleMouseMove);

    return () => {
      map.off("click", handleClick);
      map.off("mousemove", handleMouseMove);
    };
  }, [enabledLayers, map]);

  return (
    <>
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
      <FeaturePopup
        map={map}
        feature={selectedFeature?.feature ?? null}
        lngLat={selectedFeature?.lngLat ?? null}
        onClose={handlePopupClose}
      />
    </>
  );
}
