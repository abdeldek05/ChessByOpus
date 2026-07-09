import type { RadarTemplate } from "@/types/radar.types";

export const radarTemplates: RadarTemplate[] = [
  {
    id: "grf",
    name: "Giraffe 1X",
    manufacturer: "Saab",
    rangeKm: 75,
    ceilingM: 20000,
    rotating: true,
    minDetectableRcsM2: 1,
    modelPath: "/models/giraffe.glb",
    tintColor: "#5c6650",
  },
  {
    id: "gm60",
    name: "GM 60",
    manufacturer: "Thales",
    rangeKm: 60,
    ceilingM: 20000,
    rotating: true,
    minDetectableRcsM2: 1,
    modelPath: "/models/gm60.glb",
  },
];
