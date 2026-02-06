import { LAYERS } from "../config/layers";

interface LayerMenuProps {
  enabledLayers: Set<string>;
  onToggleLayer: (layerId: string) => void;
}

export function LayerMenu({ enabledLayers, onToggleLayer }: LayerMenuProps) {
  return (
    <div
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        backgroundColor: "white",
        borderRadius: "4px",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
        padding: "10px",
        zIndex: 1000,
        maxHeight: "calc(100vh - 40px)",
        overflowY: "auto",
      }}
    >
      <h3 style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: 600 }}>
        Layers
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {LAYERS.map((layer) => (
          <label
            key={layer.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            <input
              type="checkbox"
              checked={enabledLayers.has(layer.id)}
              onChange={() => onToggleLayer(layer.id)}
            />
            <span
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: layer.color,
                borderRadius: layer.geometryType === "Point" ? "50%" : "2px",
                border: "1px solid rgba(0, 0, 0, 0.2)",
              }}
            />
            <span>{layer.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
