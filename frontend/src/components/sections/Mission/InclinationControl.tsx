import { InclinationDial } from './InclinationDial'
import { INCLINATION_MIN, INCLINATION_MAX } from '@/lib/validateScenario'

interface InclinationControlProps {
  value: number
  onChange: (deg: number) => void
}

/**
 * Réglage d'élévation : cadran SVG léger et fluide qu'on saisit pour faire
 * pivoter la fusée sur l'arc gradué 70–90°, au dixième de degré. Ici on
 * orchestre l'en-tête (label + valeur) et le cadran ; l'interaction vit dans
 * InclinationDial.
 */
export function InclinationControl({ value, onChange }: InclinationControlProps) {
  return (
    <div data-guide="inclination" className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink-dim">Elevation</span>
        <span className="text-sm font-semibold text-accent-bright">
          {value.toFixed(1).replace('.', ',')} <span className="font-normal text-ink-faint">°</span>
        </span>
      </div>

      <p className="text-[11px] text-ink-faint">Grab the rocket — {INCLINATION_MIN}–{INCLINATION_MAX}°</p>

      <InclinationDial value={value} onChange={onChange} />
    </div>
  )
}
