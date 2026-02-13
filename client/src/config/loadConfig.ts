import type { AppConfig, LayerConfig, TipgCollectionsResponse } from "./types";

function autoDetectTipgUrl(): string {
  if (typeof window !== "undefined") {
    if (window.location.port === "5173") {
      return "http://localhost:8000";
    } else {
      return `${window.location.origin}/api`;
    }
  }
  return "/api";
}

export async function loadConfig(): Promise<{
  layers: LayerConfig[];
  defaultEnabledLayers: string[];
  tipgUrl: string;
  schemaPrefix: string;
}> {
  // Fetch config.json
  const configResponse = await fetch("/config.json");
  if (!configResponse.ok) {
    throw new Error(`Failed to load config.json: ${configResponse.statusText}`);
  }
  const config: AppConfig = await configResponse.json();

  // Resolve tipgUrl
  const tipgUrl = config.tipgUrl ?? autoDetectTipgUrl();

  // Try to fetch available collections from tipg
  let availableCollections: Set<string> = new Set();
  try {
    const collectionsResponse = await fetch(`${tipgUrl}/collections`);
    if (collectionsResponse.ok) {
      const collectionsData: TipgCollectionsResponse =
        await collectionsResponse.json();
      availableCollections = new Set(
        collectionsData.collections.map((c) => {
          // Strip schema prefix if present (e.g., "gunnison.road" -> "road")
          const parts = c.id.split(".");
          return parts.length > 1 ? parts[1] : c.id;
        })
      );
    }
  } catch (error) {
    console.warn("Failed to fetch collections from tipg, using config only:", error);
  }

  // Build layer list
  const layers: LayerConfig[] = [];
  const hiddenSet = new Set(config.hiddenCollections);

  // If we have collections from tipg, use them as the source
  if (availableCollections.size > 0) {
    for (const collectionId of availableCollections) {
      // Skip hidden collections
      if (hiddenSet.has(collectionId)) {
        continue;
      }

      // Check if we have config for this collection
      const layerOverride = config.layers[collectionId];

      // Skip if no geometryType defined (required for rendering)
      if (!layerOverride?.geometryType) {
        continue;
      }

      layers.push({
        id: collectionId,
        name: layerOverride.name ?? collectionId,
        geometryType: layerOverride.geometryType,
        color: layerOverride.color ?? "#3388ff",
        order: layerOverride.order ?? 999,
      });
    }
  } else {
    // Fallback: build from config entries that have all required fields
    for (const [id, layerOverride] of Object.entries(config.layers)) {
      if (hiddenSet.has(id)) {
        continue;
      }

      if (!layerOverride.geometryType) {
        continue;
      }

      layers.push({
        id,
        name: layerOverride.name ?? id,
        geometryType: layerOverride.geometryType,
        color: layerOverride.color ?? "#3388ff",
        order: layerOverride.order ?? 999,
      });
    }
  }

  // Sort by order field
  layers.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return {
    layers,
    defaultEnabledLayers: config.defaultEnabledLayers,
    tipgUrl,
    schemaPrefix: config.schemaPrefix,
  };
}
