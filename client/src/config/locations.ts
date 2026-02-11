export interface LocationConfig {
  id: string;
  label: string;
  center: [number, number]; // [lng, lat]
  zoom: number;
}

export const LOCATIONS: LocationConfig[] = [
  {
    id: "gunnison",
    label: "Gunnison",
    center: [-106.9253, 38.5458], // Approximate center
    zoom: 13,
  },
  {
    id: "crested-butte",
    label: "Crested Butte",
    center: [-106.9878, 38.8697],
    zoom: 13,
  },
  {
    id: "mount-crested-butte",
    label: "Mount Crested Butte",
    center: [-106.9703, 38.8997],
    zoom: 13,
  },
  {
    id: "marble",
    label: "Marble",
    center: [-107.1914, 39.0714],
    zoom: 13,
  },
  {
    id: "pitkin",
    label: "Pitkin",
    center: [-106.5167, 38.6083],
    zoom: 13,
  },
  {
    id: "somerset",
    label: "Somerset",
    center: [-107.3667, 38.9167],
    zoom: 13,
  },
];
