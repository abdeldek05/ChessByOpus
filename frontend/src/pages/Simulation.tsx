import { useState } from "react";
import { SimulationMap } from "@/components/sections/Simulation/SimulationMap";
import { SiteInfoPanel } from "@/components/sections/Simulation/SiteInfoPanel";
import { SiteSelectPrompt } from "@/components/sections/Simulation/SiteSelectPrompt";
import { HudOverlay } from "@/components/sections/Simulation/HudOverlay";
import { launchSites } from "@/data/launchSites";
import type { LaunchSite } from "@/types/simulation.types";

export function Simulation() {
  const [selectedSite, setSelectedSite] = useState<LaunchSite | null>(null);

  return (
    <div className="theme-dark relative h-screen w-screen overflow-hidden bg-bg">
      <SimulationMap onSiteSelect={setSelectedSite} />
      <HudOverlay />
      <SiteSelectPrompt
        siteCount={launchSites.length}
        visible={!selectedSite}
      />
      <SiteInfoPanel key={selectedSite?.id} site={selectedSite} />
    </div>
  );
}
