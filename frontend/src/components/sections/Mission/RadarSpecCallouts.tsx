import type { RadarConfig } from '@/types/radar.types'

interface RadarSpecCalloutsProps {
  config: RadarConfig
}

export function RadarSpecCallouts({ config }: RadarSpecCalloutsProps) {
  return (
    <>
      <div className="hud-callout hud-callout--right top-10 left-[58%] font-mono">
        <p className="ml-12 text-[10px] tracking-[0.15em] text-ink-dim uppercase">Portée</p>
        <p className="ml-12 text-sm text-accent">{config.rangeKm} km</p>
      </div>

      <div className="hud-callout hud-callout--left right-10 top-1/2 font-mono">
        <p className="mr-12 text-right text-[10px] tracking-[0.15em] text-ink-dim uppercase">Plafond</p>
        <p className="mr-12 text-right text-sm text-accent">{config.ceilingM} m</p>
      </div>

      <div className="hud-callout hud-callout--right bottom-12 left-[58%] font-mono">
        <p className="ml-12 text-[10px] tracking-[0.15em] text-ink-dim uppercase">Rotatif</p>
        <p className="ml-12 text-sm text-accent">{config.rotating ? 'Oui' : 'Non'}</p>
      </div>
    </>
  )
}
