import { useAzimuthTape, AZIMUTH_TAPE_HALF_WINDOW_DEG } from '@/hooks/useAzimuthTape'

interface AzimuthTapeProps {
  azimuthDeg: number
}

// Un degré d'écart = cette hauteur en % du ruban (100% couvre ±HALF_WINDOW_DEG).
const PERCENT_PER_DEG = 50 / AZIMUTH_TAPE_HALF_WINDOW_DEG

/** Position verticale (%) d'un tick : centre = 50%, offset négatif = plus haut. */
function tickTop(offsetDeg: number): number {
  return 50 + offsetDeg * PERCENT_PER_DEG
}

/**
 * Ruban d'azimut vertical, collé au bord droit de la carte des menaces, façon
 * bande d'instrument de bord d'avion : les caps défilent verticalement au fil du
 * réglage (le clic sur la carte reste l'unique contrôle), la valeur courante
 * toujours centrée avec un curseur pulsé. Léger effet pseudo-3D (perspective +
 * fondu haut/bas) pour l'aspect « signal » demandé. Pur affichage.
 */
export function AzimuthTape({ azimuthDeg }: AzimuthTapeProps) {
  const ticks = useAzimuthTape(azimuthDeg)

  return (
    <div className="azimuth-tape pointer-events-none absolute top-0 right-0 flex h-full w-20 flex-col items-end">
      <div className="azimuth-tape__scene relative h-full w-full">
        {/* Piste défilante : chaque graduation positionnée selon son offset. */}
        {ticks.map((tick) => (
          <div
            key={`${tick.deg}-${tick.offsetDeg}`}
            className={`azimuth-tape__tick absolute right-3 flex -translate-y-1/2 items-center gap-2 ${
              tick.cardinal ? 'text-accent-bright' : 'text-ink-dim'
            }`}
            style={{ top: `${tickTop(tick.offsetDeg)}%` }}
          >
            <span
              className={`font-data tabular-nums ${
                tick.cardinal ? 'text-[13px] font-semibold' : 'text-[11px] font-medium opacity-70'
              }`}
            >
              {tick.deg.toString().padStart(3, '0')}
            </span>
            <span className={`block h-px ${tick.cardinal ? 'w-4 bg-accent-bright' : 'w-2.5 bg-ink-faint'}`} />
          </div>
        ))}

        {/* Curseur central : trait vif + valeur courante, avec pulse « signal ». */}
        <div className="absolute top-1/2 right-0 flex -translate-y-1/2 items-center gap-2">
          <span className="azimuth-tape__value font-data text-lg font-bold tabular-nums text-accent-bright">
            {Math.round(azimuthDeg).toString().padStart(3, '0')}°
          </span>
          <span className="azimuth-tape__cursor block h-6 w-1 rounded-full bg-accent-bright" />
        </div>
      </div>
    </div>
  )
}
