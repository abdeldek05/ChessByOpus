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
    <div className="hud-glass w-56 rounded-xl p-3.5">
      <p className="type-label font-display text-accent">{site.name}</p>
      <p className="type-label-tight mt-0.5 font-display text-ink-faint">{site.operator}</p>

      {weather ? (
        <div className="mt-3 space-y-1.5 font-display">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-3xl leading-none text-ink tabular-nums">
              {Math.round(weather.temperatureC)}°
            </span>
            <span className="type-label-tight text-ink-dim">
              {describeWeatherCode(weather.weatherCode)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 font-mono text-label text-ink-dim">
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
        <p className="type-label-tight mt-3 font-display text-ink-faint">
          Weather unavailable
        </p>
      )}
    </div>
  )
}
