export interface LayerConfig {
  id: string;
  name: string;
  geometryType: "Point" | "LineString" | "Polygon";
  color: string;
}

export const LAYERS: LayerConfig[] = [
  {
    id: "address",
    name: "Addresses",
    geometryType: "Point",
    color: "#e41a1c",
  },
  {
    id: "driveway",
    name: "Driveways",
    geometryType: "LineString",
    color: "#984ea3",
  },
  {
    id: "exempt",
    name: "Exempt",
    geometryType: "Polygon",
    color: "#4daf4a",
  },
  {
    id: "jurisdictions",
    name: "Jurisdictions",
    geometryType: "Polygon",
    color: "#ff7f00",
  },
  {
    id: "road",
    name: "Roads",
    geometryType: "LineString",
    color: "#ff6600",
  },
  {
    id: "sections",
    name: "Sections",
    geometryType: "Polygon",
    color: "#a65628",
  },
  {
    id: "subdivision",
    name: "Subdivisions",
    geometryType: "Polygon",
    color: "#f781bf",
  },
  {
    id: "taxdistrict",
    name: "Tax Districts",
    geometryType: "Polygon",
    color: "#999999",
  },
  {
    id: "taxparcelassessor",
    name: "Tax Parcels",
    geometryType: "Polygon",
    color: "#3388ff",
  },
  {
    id: "towns",
    name: "Towns",
    geometryType: "Polygon",
    color: "#377eb8",
  },
  {
    id: "votingprecincts",
    name: "Voting Precincts",
    geometryType: "Polygon",
    color: "#e6ab02",
  },
];

export const TIPG_URL = (() => {
  let url: string;
  if (typeof window !== "undefined") {
    if (window.location.port === "5173") {
      url = "http://localhost:8000";  // Dev mode: connect directly to tipg
    } else {
      url = `${window.location.origin}/api`;  // Production: use nginx proxy
    }
  } else {
    url = "/api";
  }
  // #region agent log
  if (typeof window !== "undefined") {
    fetch('http://127.0.0.1:7243/ingest/e32a33c2-08d6-418c-9317-4d81ec6888fe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'layers.ts:77',message:'TIPG_URL constructed',data:{port:window.location.port,origin:window.location.origin,TIPG_URL:url},timestamp:Date.now(),hypothesisId:'G'})}).catch(()=>{});
  }
  // #endregion
  return url;
})();
