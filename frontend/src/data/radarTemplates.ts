import type { RadarTemplate } from "@/types/radar.types";

export const radarTemplates: RadarTemplate[] = [
  {
    id: "gm400",
    model: "GM400",
    name: "GM400",
    manufacturer: "Thales",
    rangeKm: 470,
    ceilingM: 30500,
    rotating: true,
    rotationRpm: 10,
    minDetectableRcsM2: 2.0,
    antennaHeightM: 8,
    elevationMaxDeg: 40,
    modelPath: "/models/giraffe.glb",
    tintColor: "#5c6650",
  },
  {
    id: "gf300",
    model: "GF300",
    name: "GF300",
    manufacturer: "Thales",
    rangeKm: 400,
    ceilingM: 25000,
    rotating: true,
    rotationRpm: 60,
    minDetectableRcsM2: 2,
    antennaHeightM: 4,
    elevationMaxDeg: 90,
    modelPath: "/models/gm60.glb",
  },
];
