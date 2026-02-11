import { LOCATIONS } from "../config/locations";

interface TownNavigatorProps {
  selectedLocationId: string | null;
  onLocationChange: (locationId: string) => void;
}

export function TownNavigator({
  selectedLocationId,
  onLocationChange,
}: TownNavigatorProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: "60px",
        left: "10px",
        backgroundColor: "white",
        borderRadius: "4px",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.3)",
        padding: "8px",
        zIndex: 999999,
        minWidth: "180px",
      }}
    >
      <label
        style={{
          display: "block",
          fontSize: "12px",
          fontWeight: 600,
          marginBottom: "4px",
          color: "#333",
        }}
      >
        Zoom to Town
      </label>
      <select
        value={selectedLocationId || ""}
        onChange={(e) => {
          if (e.target.value) {
            onLocationChange(e.target.value);
          }
        }}
        style={{
          width: "100%",
          padding: "6px 8px",
          fontSize: "13px",
          border: "1px solid #ccc",
          borderRadius: "3px",
          backgroundColor: "white",
          cursor: "pointer",
        }}
      >
        <option value="">Select a town...</option>
        {LOCATIONS.map((location) => (
          <option key={location.id} value={location.id}>
            {location.label}
          </option>
        ))}
      </select>
    </div>
  );
}
