export interface LayerConfig {
  id: string;
  name: string;
  geometryType: "Point" | "LineString" | "Polygon";
  color: string;
  order?: number;
}

export interface LayerOverride {
  name?: string;
  geometryType?: "Point" | "LineString" | "Polygon";
  color?: string;
  order?: number;
}

export interface AppConfig {
  tipgUrl: string | null;
  schemaPrefix: string;
  defaultEnabledLayers: string[];
  hiddenCollections: string[];
  layers: Record<string, LayerOverride>;
}

export interface TipgCollection {
  id: string;
  title?: string;
  itemType?: string;
}

export interface TipgCollectionsResponse {
  collections: TipgCollection[];
}
