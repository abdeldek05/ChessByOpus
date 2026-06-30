import "maplibre-gl/dist/maplibre-gl.css";
import { useSimulationMap } from "@/hooks/useSimulationMap";
import { useSitesWeather } from "@/hooks/useSitesWeather";
import type { LaunchSite } from "@/types/simulation.types";

interface SimulationMapProps {
  onSiteSelect: (site: LaunchSite) => void;
}

export function SimulationMap({ onSiteSelect }: SimulationMapProps) {
  const weatherBySiteId = useSitesWeather();
  const { containerRef } = useSimulationMap({ onSiteSelect, weatherBySiteId });

  return <div ref={containerRef} className="h-full w-full" />;
}
