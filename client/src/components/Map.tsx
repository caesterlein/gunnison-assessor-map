import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { LAYERS, TIPG_URL } from "../config/layers";
import type { LayerConfig } from "../config/layers";
import { BASE_MAPS } from "../config/baseMaps";
import type { BaseMapType } from "../config/baseMaps";
import { LOCATIONS } from "../config/locations";
import { FeaturePopup } from "./FeaturePopup";
import { ScaleControl } from "./ScaleControl";

const GUNNISON_CENTER: [number, number] = [-106.9, 38.6];

// Safe logging function that never throws
function safeLog(location: string, message: string, data: any, hypothesisId?: string) {
  try {
    // Safely serialize data, handling circular references
    let safeData = data;
    if (typeof data === 'object' && data !== null) {
      try {
        // Try to stringify - if it fails due to circular refs, use a safe fallback
        JSON.stringify(data);
        safeData = data;
      } catch (e) {
        // If circular reference, create a safe representation
        safeData = Object.keys(data).reduce((acc: any, key) => {
          const value = data[key];
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
            acc[key] = value;
          } else if (value instanceof Error) {
            acc[key] = { message: value.message, name: value.name };
          } else {
            acc[key] = String(value);
          }
          return acc;
        }, {});
      }
    }
    
    const payload = {
      location,
      message,
      data: safeData,
      timestamp: Date.now(),
      ...(hypothesisId && { hypothesisId }),
    };
    fetch('http://127.0.0.1:7243/ingest/e32a33c2-08d6-418c-9317-4d81ec6888fe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch (e) {
    // Silently fail - logging should never crash the app
  }
}

interface MapProps {
  enabledLayers: Set<string>;
  baseMapType: BaseMapType;
  selectedLocationId: string | null;
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

function addLayerToMap(map: maplibregl.Map, layer: LayerConfig) {
  // #region agent log
  safeLog('Map.tsx:76', 'addLayerToMap called', { layerId: layer.id, layerName: layer.name, geometryType: layer.geometryType, hasSource: !!map.getSource(layer.id) });
  // #endregion
  if (map.getSource(layer.id)) {
    // #region agent log
    safeLog('Map.tsx:80', 'Source already exists, skipping', { layerId: layer.id });
    // #endregion
    console.log(`Source ${layer.id} already exists, skipping`);
    return;
  }

  // tipg tile URL format: /collections/{collectionId}/tiles/{tileMatrixSetId}/{z}/{x}/{y}
  // Collection ID format may be schema.table or just table name
  // Try with schema prefix first
  const tileUrl = `${TIPG_URL}/collections/gunnison.${layer.id}/tiles/WebMercatorQuad/{z}/{x}/{y}`;
  // #region agent log
  safeLog('Map.tsx:91', 'Tile URL constructed', { layerId: layer.id, tileUrl: tileUrl, TIPG_URL: TIPG_URL, urlLength: tileUrl.length }, 'A');
  // #endregion
  console.log(`[DEBUG] Adding layer ${layer.id}`);
  console.log(`[DEBUG] TIPG_URL:`, TIPG_URL);
  console.log(`[DEBUG] Full tile URL:`, tileUrl);
  console.log(`[DEBUG] URL length:`, tileUrl.length);
  console.log(`[DEBUG] Expected format: ${TIPG_URL}/collections/gunnison.${layer.id}/tiles/WebMercatorQuad/{z}/{x}/{y}`);

  const sourceConfig = {
    type: "vector" as const,
    tiles: [tileUrl],
  };
  // #region agent log
  const sourceConfigData = {
    layerId: layer.id,
    sourceType: sourceConfig.type,
    tilesCount: sourceConfig.tiles.length,
    firstTile: sourceConfig.tiles[0]?.substring(0, 100) || 'empty',
  };
  safeLog('Map.tsx:112', 'Source config before addSource', sourceConfigData, 'B');
  // #endregion

  try {
    map.addSource(layer.id, sourceConfig);
    // #region agent log
    safeLog('Map.tsx:116', 'addSource called successfully', { layerId: layer.id }, 'C');
    // #endregion

    // Base maps are added synchronously in map.on('load') before vector layers
    // So vector layers added here will naturally be above base maps
    // Add layers at the end (no beforeId) - this ensures they render above base maps

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
        console.log(`Added ${layer.id}-circle layer`);
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
        console.log(`Added ${layer.id}-line layer`);
        break;
      case "Polygon":
        // Special styling for jurisdictions
        if (layer.id === "jurisdictions") {
          map.addLayer({
            id: `${layer.id}-fill`,
            type: "fill",
            source: layer.id,
            "source-layer": "default",
            paint: {
              "fill-color": "#9b59b6", // Purple
              "fill-opacity": 0.15, // More transparent
            },
          });
          map.addLayer({
            id: `${layer.id}-outline`,
            type: "line",
            source: layer.id,
            "source-layer": "default",
            paint: {
              "line-color": "#8e44ad", // Darker purple for outline
              "line-width": 2, // Thicker outline
              "line-opacity": 0.8,
            },
          });
          console.log(`Added ${layer.id}-fill and ${layer.id}-outline layers (jurisdictions styling)`);
        } else {
          // Default styling for other polygons
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
          console.log(`Added ${layer.id}-fill and ${layer.id}-outline layers`);
        }
        break;
    }
  } catch (error) {
    // #region agent log
    const errorData = {
      layerId: layer.id,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    };
    safeLog('Map.tsx:185', 'Error adding layer', errorData, 'D');
    // #endregion
    console.error(`Error adding layer ${layer.id}:`, error);
  }
  
  // Add error handler to catch tile loading errors
  const errorHandler = (e: maplibregl.ErrorEvent) => {
    // #region agent log
    const errorData = {
      layerId: layer.id,
      errorMessage: e.error?.message || 'unknown',
      errorType: e.error ? e.error.constructor.name : 'unknown',
    };
    safeLog('Map.tsx:198', 'Map error event', errorData, 'E');
    // #endregion
  };
  map.once('error', errorHandler);
  
  // Monitor source data loading
  const sourceDataHandler = (e: maplibregl.MapSourceDataEvent) => {
    if (e.sourceId === layer.id) {
      // #region agent log
      const tileData = e.tile ? {
        tileID: e.tile.tileID?.toString() || 'unknown',
        state: e.tile.state || 'unknown',
      } : null;
      const eventData = {
        layerId: layer.id,
        sourceId: e.sourceId,
        isSourceLoaded: e.isSourceLoaded,
        dataType: e.dataType,
        tile: tileData,
      };
      safeLog('Map.tsx:218', 'Source data event', eventData, 'F');
      // #endregion
    }
  };
  map.on('sourcedata', sourceDataHandler);
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

export function Map({ enabledLayers, baseMapType, selectedLocationId }: MapProps) {
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
      // #region agent log
      safeLog('Map.tsx:277', 'Map load event fired', {}, 'H');
      // #endregion
      
      // Add satellite and terrain base maps synchronously when map loads
      // This ensures they're added before any vector layers
      const satelliteConfig = BASE_MAPS.satellite;
      const terrainConfig = BASE_MAPS.terrain;

      // Add satellite source and layer
      if (!newMap.getSource(satelliteConfig.sourceId)) {
        // #region agent log
        safeLog('Map.tsx:288', 'Adding satellite source', { sourceId: satelliteConfig.sourceId }, 'H');
        // #endregion
        newMap.addSource(satelliteConfig.sourceId, satelliteConfig.source);
        newMap.addLayer({
          id: satelliteConfig.layerId,
          type: 'raster',
          source: satelliteConfig.sourceId,
          layout: { visibility: 'none' }, // Hidden by default
        });
        // #region agent log
        safeLog('Map.tsx:298', 'Satellite layer added', { layerId: satelliteConfig.layerId, hasLayer: !!newMap.getLayer(satelliteConfig.layerId) }, 'H');
        // #endregion
      }

      // Add terrain source and layer
      if (!newMap.getSource(terrainConfig.sourceId)) {
        // #region agent log
        safeLog('Map.tsx:305', 'Adding terrain source', { sourceId: terrainConfig.sourceId }, 'H');
        // #endregion
        newMap.addSource(terrainConfig.sourceId, terrainConfig.source);
        newMap.addLayer({
          id: terrainConfig.layerId,
          type: 'raster',
          source: terrainConfig.sourceId,
          layout: { visibility: 'none' }, // Hidden by default
        });
        // #region agent log
        safeLog('Map.tsx:315', 'Terrain layer added', { layerId: terrainConfig.layerId, hasLayer: !!newMap.getLayer(terrainConfig.layerId) }, 'H');
        // #endregion
      }

      // Set map state AFTER all base maps are added
      // This ensures base map switching logic can find all layers
      setMap(newMap);
      // #region agent log
      safeLog('Map.tsx:323', 'Map state set, all base maps added', { hasOsm: !!newMap.getLayer('osm'), hasSatellite: !!newMap.getLayer('satellite'), hasTerrain: !!newMap.getLayer('terrain') }, 'H');
      // #endregion
      
      // Ensure default base map (street/OSM) is visible
      // The OSM layer is already visible in initial style, but ensure it stays visible
      const osmLayer = newMap.getLayer('osm');
      if (osmLayer) {
        newMap.setLayoutProperty('osm', 'visibility', 'visible');
        // #region agent log
        safeLog('Map.tsx:332', 'Ensured OSM layer visible', { layerId: 'osm' }, 'H');
        // #endregion
      }
    });

    return () => {
      newMap.remove();
    };
  }, []);


  // Switch base map visibility based on baseMapType prop
  useEffect(() => {
    if (!map) return;

    // #region agent log
    safeLog('Map.tsx:348', 'Base map switching effect running', { baseMapType: baseMapType, mapLoaded: !!map }, 'I');
    // #endregion

    // Get all base map types
    const baseMapTypes: BaseMapType[] = ['street', 'satellite', 'terrain'];

    // Toggle visibility: show selected base map, hide others
    baseMapTypes.forEach((type) => {
      const config = BASE_MAPS[type];
      const visibility = type === baseMapType ? 'visible' : 'none';
      const layerExists = map.getLayer(config.layerId);
      
      // #region agent log
      safeLog('Map.tsx:361', 'Checking base map layer', { type: type, layerId: config.layerId, layerExists: layerExists, visibility: visibility, baseMapType: baseMapType }, 'I');
      // #endregion
      
      if (layerExists) {
        map.setLayoutProperty(config.layerId, 'visibility', visibility);
        // #region agent log
        safeLog('Map.tsx:367', 'Set base map visibility', { layerId: config.layerId, visibility: visibility }, 'I');
        // #endregion
      } else {
        // #region agent log
        safeLog('Map.tsx:371', 'Base map layer not found', { type: type, layerId: config.layerId }, 'I');
        // #endregion
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

    LAYERS.forEach((layer) => {
      const isEnabled = enabledLayers.has(layer.id);
      const sourceExists = map.getSource(layer.id);

      if (isEnabled && !sourceExists) {
        try {
          addLayerToMap(map, layer);
        } catch (error) {
          console.error(`Failed to add layer ${layer.id}:`, error);
        }
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
        const selectedFeature = features[0];
        setSelectedFeature({
          feature: selectedFeature as GeoJSON.Feature,
          lngLat: e.lngLat,
          layerId: selectedFeature.layer?.id || "",
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
