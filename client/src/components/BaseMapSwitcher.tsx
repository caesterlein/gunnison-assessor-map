import { BASE_MAPS } from "../config/baseMaps";
import type { BaseMapType } from "../config/baseMaps";

interface BaseMapSwitcherProps {
  baseMapType: BaseMapType;
  onBaseMapChange: (type: BaseMapType) => void;
}

export function BaseMapSwitcher({
  baseMapType,
  onBaseMapChange,
}: BaseMapSwitcherProps) {
  // #region agent log
  if (typeof window !== "undefined") {
    console.log('[BaseMapSwitcher] Component rendering', { baseMapType, baseMapsCount: Object.keys(BASE_MAPS).length });
  }
  // #endregion
  
  // Safety check - ensure BASE_MAPS has data
  const baseMapTypes = Object.keys(BASE_MAPS) as BaseMapType[];
  if (baseMapTypes.length === 0) {
    console.error('[BaseMapSwitcher] BASE_MAPS is empty!');
    return null;
  }
  
  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        left: "10px",
        backgroundColor: "#ffffff",
        borderRadius: "4px",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
        padding: "8px",
        zIndex: 999999,
        display: "flex",
        gap: "4px",
        pointerEvents: "auto",
        minWidth: "200px",
        border: "2px solid #3388ff",
      }}
      data-testid="base-map-switcher"
    >
      {baseMapTypes.map((type) => {
        // #region agent log
        // Logging removed to prevent circular reference errors
        // #endregion
        return (
          <button
            key={type}
            onClick={() => {
              // #region agent log
              console.log('[BaseMapSwitcher] Button clicked', { type, previousType: baseMapType });
              // #endregion
              onBaseMapChange(type);
            }}
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              border: "1px solid #ccc",
              borderRadius: "3px",
              backgroundColor: baseMapType === type ? "#3388ff" : "white",
              color: baseMapType === type ? "white" : "#333",
              cursor: "pointer",
            }}
          >
            {BASE_MAPS[type].name}
          </button>
        );
      })}
    </div>
  );
}
