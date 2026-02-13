import { useState, useCallback, useEffect } from "react";
import { Map } from "./components/Map";
import { LayerMenu } from "./components/LayerMenu";
import { BaseMapSwitcher } from "./components/BaseMapSwitcher";
import { TownNavigator } from "./components/TownNavigator";
import type { BaseMapType } from "./config/baseMaps";
import type { LayerConfig } from "./config/types";
import { loadConfig } from "./config/loadConfig";

type ConfigState =
  | { status: "loading" }
  | { status: "error"; error: string }
  | {
      status: "ready";
      layers: LayerConfig[];
      tipgUrl: string;
      schemaPrefix: string;
      defaultEnabledLayers: string[];
    };

function App() {
  const [configState, setConfigState] = useState<ConfigState>({
    status: "loading",
  });

  const [enabledLayers, setEnabledLayers] = useState<Set<string>>(new Set());
  const [baseMapType, setBaseMapType] = useState<BaseMapType>("street");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );

  useEffect(() => {
    loadConfig()
      .then((config) => {
        setConfigState({
          status: "ready",
          layers: config.layers,
          tipgUrl: config.tipgUrl,
          schemaPrefix: config.schemaPrefix,
          defaultEnabledLayers: config.defaultEnabledLayers,
        });
        setEnabledLayers(new Set(config.defaultEnabledLayers));
      })
      .catch((error) => {
        setConfigState({
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      });
  }, []);

  const handleToggleLayer = useCallback((layerId: string) => {
    setEnabledLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  }, []);

  const handleRetry = useCallback(() => {
    setConfigState({ status: "loading" });
    loadConfig()
      .then((config) => {
        setConfigState({
          status: "ready",
          layers: config.layers,
          tipgUrl: config.tipgUrl,
          schemaPrefix: config.schemaPrefix,
          defaultEnabledLayers: config.defaultEnabledLayers,
        });
        setEnabledLayers(new Set(config.defaultEnabledLayers));
      })
      .catch((error) => {
        setConfigState({
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      });
  }, []);

  if (configState.status === "loading") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0f0f0",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            Loading map configuration...
          </div>
        </div>
      </div>
    );
  }

  if (configState.status === "error") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f0f0f0",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: "500px", padding: "20px" }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              marginBottom: "10px",
              color: "#d32f2f",
            }}
          >
            Failed to load configuration
          </div>
          <div style={{ marginBottom: "20px", color: "#666" }}>
            {configState.error}
          </div>
          <button
            onClick={handleRetry}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              cursor: "pointer",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Map
        enabledLayers={enabledLayers}
        baseMapType={baseMapType}
        selectedLocationId={selectedLocationId}
        layers={configState.layers}
        tipgUrl={configState.tipgUrl}
        schemaPrefix={configState.schemaPrefix}
      />
      <LayerMenu
        enabledLayers={enabledLayers}
        onToggleLayer={handleToggleLayer}
        layers={configState.layers}
      />
      <BaseMapSwitcher
        baseMapType={baseMapType}
        onBaseMapChange={setBaseMapType}
      />
      <TownNavigator
        selectedLocationId={selectedLocationId}
        onLocationChange={setSelectedLocationId}
      />
    </div>
  );
}

export default App;
