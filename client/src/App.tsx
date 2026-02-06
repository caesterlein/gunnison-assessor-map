import { useState, useCallback } from "react";
import { Map } from "./components/Map";
import { LayerMenu } from "./components/LayerMenu";

function App() {
  const [enabledLayers, setEnabledLayers] = useState<Set<string>>(
    () => new Set(["taxparcelassessor", "road"])
  );

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

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Map enabledLayers={enabledLayers} />
      <LayerMenu
        enabledLayers={enabledLayers}
        onToggleLayer={handleToggleLayer}
      />
    </div>
  );
}

export default App;
