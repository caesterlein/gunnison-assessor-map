import { useState, useCallback } from "react";
import { Map } from "./components/Map";
import { LayerMenu } from "./components/LayerMenu";
import { BaseMapSwitcher } from "./components/BaseMapSwitcher";
import { TownNavigator } from "./components/TownNavigator";
import type { BaseMapType } from "./config/baseMaps";

function App() {
  const [enabledLayers, setEnabledLayers] = useState<Set<string>>(
    () => new Set(["taxparcelassessor", "road"])
  );

  // New base map state (separate)
  const [baseMapType, setBaseMapType] = useState<BaseMapType>('street');

  // Town navigation state
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

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

  // #region agent log
  if (typeof window !== "undefined") {
    console.log('[App] Rendering with BaseMapSwitcher', { baseMapType });
  }
  // #endregion

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Map 
        enabledLayers={enabledLayers} 
        baseMapType={baseMapType}
        selectedLocationId={selectedLocationId}
      />
      <LayerMenu
        enabledLayers={enabledLayers}
        onToggleLayer={handleToggleLayer}
      />
      {/* #region agent log */}
      {typeof window !== "undefined" && console.log('[App] About to render BaseMapSwitcher')}
      {/* #endregion */}
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
