import { useState } from "react";
import { SimulationMap } from "@/components/sections/Simulation/SimulationMap";
import { SiteInfoPanel } from "@/components/sections/Simulation/SiteInfoPanel";
import { HudOverlay } from "@/components/sections/Simulation/HudOverlay";
import type { LaunchSite } from "@/types/simulation.types";

export function Simulation() {
  const [selectedSite, setSelectedSite] = useState<LaunchSite | null>(null);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg">
      <SimulationMap onSiteSelect={setSelectedSite} />
      <HudOverlay />
      <SiteInfoPanel site={selectedSite} />
    </div>
  );
}
