import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { LayerConfig } from "../config/types";
import { BASE_MAPS } from "../config/baseMaps";
import type { BaseMapType } from "../config/baseMaps";
import { LOCATIONS } from "../config/locations";
import { FeaturePopup } from "./FeaturePopup";
import { ScaleControl } from "./ScaleControl";

const GUNNISON_CENTER: [number, number] = [-106.9, 38.6];

interface MapProps {
  enabledLayers: Set<string>;
  baseMapType: BaseMapType;
  selectedLocationId: string | null;
  layers: LayerConfig[];
  tipgUrl: string;
  schemaPrefix: string;
}

interface SelectedFeature {
  feature: GeoJSON.Feature;
  lngLat: maplibregl.LngLat;
  layerId: string;
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

function addLayerToMap(
  map: maplibregl.Map,
  layer: LayerConfig,
  tipgUrl: string,
  schemaPrefix: string
) {
  if (map.getSource(layer.id)) {
    return;
  }

  const tileUrl = `${tipgUrl}/collections/${schemaPrefix}.${layer.id}/tiles/WebMercatorQuad/{z}/{x}/{y}`;

  const sourceConfig = {
    type: "vector" as const,
    tiles: [tileUrl],
  };

  try {
    map.addSource(layer.id, sourceConfig);

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
        if (layer.id === "jurisdictions") {
          map.addLayer({
            id: `${layer.id}-fill`,
            type: "fill",
            source: layer.id,
            "source-layer": "default",
            paint: {
              "fill-color": "#9b59b6",
              "fill-opacity": 0.15,
            },
          });
          map.addLayer({
            id: `${layer.id}-outline`,
            type: "line",
            source: layer.id,
            "source-layer": "default",
            paint: {
              "line-color": "#8e44ad",
              "line-width": 2,
              "line-opacity": 0.8,
            },
          });
        } else {
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
        }
        break;
    }
  } catch (error) {
    console.error(`Error adding layer ${layer.id}:`, error);
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

export function Map({
  enabledLayers,
  baseMapType,
  selectedLocationId,
  layers,
  tipgUrl,
  schemaPrefix,
}: MapProps) {
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
      const satelliteConfig = BASE_MAPS.satellite;
      const terrainConfig = BASE_MAPS.terrain;

      if (!newMap.getSource(satelliteConfig.sourceId)) {
        newMap.addSource(satelliteConfig.sourceId, satelliteConfig.source);
        newMap.addLayer({
          id: satelliteConfig.layerId,
          type: "raster",
          source: satelliteConfig.sourceId,
          layout: { visibility: "none" },
        });
      }

      if (!newMap.getSource(terrainConfig.sourceId)) {
        newMap.addSource(terrainConfig.sourceId, terrainConfig.source);
        newMap.addLayer({
          id: terrainConfig.layerId,
          type: "raster",
          source: terrainConfig.sourceId,
          layout: { visibility: "none" },
        });
      }

      setMap(newMap);

      const osmLayer = newMap.getLayer("osm");
      if (osmLayer) {
        newMap.setLayoutProperty("osm", "visibility", "visible");
      }
    });

    return () => {
      newMap.remove();
    };
  }, []);


  // Switch base map visibility based on baseMapType prop
  useEffect(() => {
    if (!map) return;

    const baseMapTypes: BaseMapType[] = ["street", "satellite", "terrain"];

    baseMapTypes.forEach((type) => {
      const config = BASE_MAPS[type];
      const visibility = type === baseMapType ? "visible" : "none";
      const layerExists = map.getLayer(config.layerId);

      if (layerExists) {
        map.setLayoutProperty(config.layerId, "visibility", visibility);
      }
    });
  }, [map, baseMapType]);

  // Zoom to selected location when selectedLocationId changes
  useEffect(() => {
    if (!map || !selectedLocationId) return;

    const location = LOCATIONS.find((loc) => loc.id === selectedLocationId);
    if (!location) return;

    map.flyTo({
      center: location.center,
      zoom: location.zoom,
      duration: 2000,
      essential: true,
    });
  }, [map, selectedLocationId]);

  // Sync enabled layers
  useEffect(() => {
    if (!map) return;

    layers.forEach((layer) => {
      const isEnabled = enabledLayers.has(layer.id);
      const sourceExists = map.getSource(layer.id);

      if (isEnabled && !sourceExists) {
        try {
          addLayerToMap(map, layer, tipgUrl, schemaPrefix);
        } catch (error) {
          console.error(`Failed to add layer ${layer.id}:`, error);
        }
      } else if (!isEnabled && sourceExists) {
        removeLayerFromMap(map, layer);
      }
    });
  }, [enabledLayers, map, layers, tipgUrl, schemaPrefix]);

  // Click and hover handlers
  useEffect(() => {
    if (!map) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const allLayerIds = layers
        .filter((l) => enabledLayers.has(l.id))
        .flatMap(getLayerIds);

      const existingLayerIds = allLayerIds.filter((id) => map.getLayer(id));
      if (existingLayerIds.length === 0) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: existingLayerIds,
      });

      if (features.length > 0) {
        const selectedFeature = features[0];
        setSelectedFeature({
          feature: selectedFeature as GeoJSON.Feature,
          lngLat: e.lngLat,
          layerId: selectedFeature.layer?.id || "",
        });
      }
    };

    const handleMouseMove = (e: maplibregl.MapMouseEvent) => {
      const allLayerIds = layers
        .filter((l) => enabledLayers.has(l.id))
        .flatMap(getLayerIds);

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
  }, [enabledLayers, map, layers]);

  return (
    <>
      <div ref={mapContainer} style={{ width: "100%", height: "100%", position: "relative" }} />
      <ScaleControl map={map} unit="imperial" />
      <FeaturePopup
        map={map}
        feature={selectedFeature?.feature ?? null}
        lngLat={selectedFeature?.lngLat ?? null}
        layerId={selectedFeature?.layerId ?? ""}
        onClose={handlePopupClose}
      />
    </>
  );
}
