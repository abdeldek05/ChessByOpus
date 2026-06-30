import { Wind, Droplets } from "lucide-react";
import { describeWeatherCode } from "@/lib/describeWeatherCode";
import type { LaunchSite } from "@/types/simulation.types";
import type { SiteWeather } from "@/types/weather.types";

interface SiteHoverCardProps {
  site: LaunchSite;
  weather: SiteWeather | null | undefined;
}

export function SiteHoverCard({ site, weather }: SiteHoverCardProps) {
  return (
    <div className="w-56 border border-accent/50 bg-bg/95 p-3 font-mono shadow-[0_0_24px_-4px_var(--color-accent)] backdrop-blur-sm">
      <p className="text-[10px] tracking-[0.18em] text-accent uppercase">{site.name}</p>
      <p className="mt-0.5 text-[10px] text-ink-faint uppercase">{site.operator}</p>

      {weather ? (
        <div className="mt-3 space-y-1.5 border-t border-border pt-2.5 text-xs">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl text-ink">{Math.round(weather.temperatureC)}°C</span>
            <span className="text-ink-dim">{describeWeatherCode(weather.weatherCode)}</span>
          </div>
          <div className="flex items-center justify-between text-ink-dim">
            <span className="flex items-center gap-1.5">
              <Wind className="size-3" strokeWidth={1.5} />
              {Math.round(weather.windSpeedKmh)} km/h
            </span>
            <span className="flex items-center gap-1.5">
              <Droplets className="size-3" strokeWidth={1.5} />
              {weather.humidityPercent}%
            </span>
          </div>
        </div>
      ) : (
        <p className="mt-3 border-t border-border pt-2.5 text-[10px] text-ink-faint uppercase">
          Météo indisponible
        </p>
      )}
    </div>
  );
}
