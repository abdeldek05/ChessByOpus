import { InclinationCanvas } from '@/three/canvas/InclinationCanvas'
import { INCLINATION_MIN_DEG, INCLINATION_MAX_DEG } from '@/three/constants/inclinationScene'

interface InclinationControlProps {
  value: number
  onChange: (deg: number) => void
}

/**
 * Réglage d'élévation : hologramme de la Mesange qu'on saisit et fait pivoter
 * sur un arc gradué 70–90°, valeur au dixième de degré. L'interaction vit dans
 * la scène (AimPlane) — ici on orchestre affichage de la valeur + canvas.
 */
export function InclinationControl({ value, onChange }: InclinationControlProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink-dim">Élévation</span>
        <span className="text-sm font-semibold text-accent-bright">
          {value.toFixed(1).replace('.', ',')} <span className="font-normal text-ink-faint">°</span>
        </span>
      </div>

      <div className="relative h-56 touch-none overflow-hidden rounded-2xl bg-bg/40 select-none cursor-grab active:cursor-grabbing">
        <InclinationCanvas inclinationDeg={value} onChange={onChange} />
        <p className="pointer-events-none absolute right-2 bottom-2 rounded-md bg-bg/70 px-2 py-1 text-[10px] font-medium tracking-wide text-ink-dim backdrop-blur-sm">
          Saisissez la fusée — {INCLINATION_MIN_DEG}–{INCLINATION_MAX_DEG}°
        </p>
      </div>
    </div>
  )
}
