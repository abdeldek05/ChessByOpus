import { Wind, Droplets } from 'lucide-react'
import { describeWeatherCode } from '@/lib/describeWeatherCode'
import type { LaunchSite } from '@/types/simulation.types'
import type { SiteWeather } from '@/types/weather.types'

interface SiteHoverCardProps {
  site: LaunchSite
  weather: SiteWeather | null | undefined
}

export function SiteHoverCard({ site, weather }: SiteHoverCardProps) {
  return (
    <div className="w-56 rounded-xl bg-surface/95 p-3.5 shadow-xl shadow-black/40 backdrop-blur-md">
      <p className="font-display text-[10px] font-semibold tracking-[0.18em] text-accent uppercase">{site.name}</p>
      <p className="mt-0.5 font-display text-[9px] tracking-[0.1em] text-ink-faint uppercase">{site.operator}</p>

      {weather ? (
        <div className="mt-3 space-y-1.5 font-display">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-3xl leading-none text-ink tabular-nums">
              {Math.round(weather.temperatureC)}°
            </span>
            <span className="text-[10px] tracking-[0.1em] text-ink-dim uppercase">
              {describeWeatherCode(weather.weatherCode)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 text-[11px] text-ink-dim">
            <span className="flex items-center gap-1.5">
              <Wind className="size-3 text-accent" strokeWidth={2} />
              {Math.round(weather.windSpeedKmh)} km/h
            </span>
            <span className="flex items-center gap-1.5">
              <Droplets className="size-3 text-accent" strokeWidth={2} />
              {weather.humidityPercent}%
            </span>
          </div>
        </div>
      ) : (
        <p className="mt-3 font-display text-[10px] tracking-[0.1em] text-ink-faint uppercase">
          Weather unavailable
        </p>
      )}
    </div>
  )
}
