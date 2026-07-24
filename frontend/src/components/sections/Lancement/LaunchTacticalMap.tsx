import 'maplibre-gl/dist/maplibre-gl.css'
import { useState } from 'react'
import { useLaunchTacticalMap } from '@/hooks/useLaunchTacticalMap'
import { useMapExpansion } from '@/hooks/useMapExpansion'
import { useLiveCoverageProfile } from '@/hooks/useLiveCoverageProfile'
import { LaunchVerticalProfile } from './LaunchVerticalProfile'
import { TacticalLegend } from './TacticalLegend'
import type { DecoyTrack } from '@/lib/launchTacticalMap'
import type { LaunchSite } from '@/types/simulation.types'
import type { PlacedRadar } from '@/types/mission.types'
import type { FlightData } from '@/lib/api'

interface LaunchTacticalMapProps {
  site: LaunchSite
  /** Tous les radars placés (1-2), tous affichés sur la carte. */
  radars: PlacedRadar[]
  /** Distance réelle pas de tir ↔ radar principal, déjà formatée. */
  distance: string
  /** Trajectoire RocketPy du ROI (null tant que non calculée) : tracée comme
   *  piste radar LIVE (s'allonge au fil du vol, suivie par la tête). */
  flight: FlightData | null
  /** Trajectoires des LEURRES (Dame/Pions) : tracées en ENTIER dès le départ,
   *  trait fin teinté par rôle — contexte tactique, pas la menace suivie. */
  decoyTracks?: DecoyTrack[]
  /** Progression du vol 0→1 (ref partagée, -1 = pas de vol) : pilote la piste live. */
  flightProgressRef: React.RefObject<number>
  /** Azimut de tir du Roi (deg) — oriente le plan de coupe du profil vertical. */
  azimuthDeg: number
}

type TacticalView = 'plan' | 'profile'

// Flight vide, valide pour le typage : useLiveCoverageProfile/useCoverageCut
// doivent être appelés INCONDITIONNELLEMENT (règle des Hooks) même quand
// `flight` est encore null (pas de vol connu). trajectory=[] fait sortir tous
// les calculs immédiatement sans crash ; `active=false` (passé plus bas)
// empêche par ailleurs tout calcul de tête live sur ces données bidon.
const EMPTY_FLIGHT: FlightData = {
  trajectory: [],
  apogeeM: 0,
  apogeeTimeSec: 0,
  rangeM: 0,
  maxSpeedMs: 0,
  flightTimeSec: 0,
  weather: { source: 'standard_atmosphere', groundWindSpeedMs: 0, groundWindHeadingDeg: 0, groundTemperatureC: 15 },
}

// Hauteur du canvas carte par cran (repliée = 0, carte masquée).
const MAP_HEIGHT: Record<string, string> = {
  collapsed: 'h-0',
  compact: 'h-52',
  expanded: 'h-96',
}
const PANEL_WIDTH: Record<string, string> = {
  collapsed: 'w-56',
  compact: 'w-72 max-w-[28vw]',
  expanded: 'w-[38rem] max-w-[60vw]',
}

/**
 * Incrustation tactique 2D (bas-droite) de l'écran de lancement : vue de dessus
 * à l'échelle réelle, là où la distance est FIDÈLE — la scène 3D montre le pas
 * de tir à taille humaine. Trois crans (repliée → compacte → agrandie) via deux
 * boutons ; pan/zoom souris actifs une fois agrandie. Chaque radar affiche son
 * faisceau rotatif qui balaie en continu, vire à l'alarme quand il accroche la
 * menace. Logique carte dans useLaunchTacticalMap.
 */
export function LaunchTacticalMap({
  site,
  radars,
  distance,
  flight,
  decoyTracks,
  flightProgressRef,
  azimuthDeg,
}: LaunchTacticalMapProps) {
  const { size, grow, shrink } = useMapExpansion()
  const [view, setView] = useState<TacticalView>('plan')
  const { containerRef } = useLaunchTacticalMap({
    site,
    radars,
    expanded: size === 'expanded',
    // Repliée (h-0, invisible) OU sur l'onglet PROFIL : inutile de faire
    // tourner les boucles rAF (piste + faisceau radar) qui repeignent
    // MapLibre à chaque frame et se disputent le thread principal avec le
    // Canvas WebGL pour rien pendant qu'on ne regarde pas le plan.
    visible: size !== 'collapsed' && view === 'plan',
    flight,
    decoyTracks,
    flightProgressRef,
  })

  // Le profil n'existe QUE si un vol est connu (useCoverageCut exige un
  // FlightData non-null) — sinon rien à couper. Le hook est toujours appelé
  // (règle des Hooks), mais `active` (calcul de la tête live) reste faux et
  // l'onglet PROFIL est masqué tant que `flight` est null.
  const profile = useLiveCoverageProfile(
    flight ?? EMPTY_FLIGHT,
    site,
    radars,
    azimuthDeg,
    flightProgressRef,
    flight !== null && view === 'profile',
  )

  return (
    <div
      className={`pointer-events-auto absolute right-6 bottom-6 overflow-hidden rounded-2xl bg-bg/70 shadow-xl shadow-black/50 ring-1 ring-accent-bright/10 backdrop-blur-sm transition-all duration-300 ${PANEL_WIDTH[size]}`}
    >
      <div className="relative z-10 flex items-center justify-between px-3.5 py-2">
        <div className="flex items-center gap-2">
          <span className="font-fine text-[11px] font-light tracking-[0.28em] text-ink-dim uppercase">Tactical view</span>
          {/* Sélecteur PLAN / PROFIL : le profil n'a de sens qu'une fois le
              vol connu (trajectoire complète disponible dès la réponse
              backend, pas besoin d'attendre le lancement visuel). */}
          {size !== 'collapsed' && flight && (
            <div className="flex items-center gap-0.5 rounded-md bg-surface/60 p-0.5">
              <button
                type="button"
                onClick={() => setView('plan')}
                className={`rounded px-1.5 py-0.5 font-mono text-[9px] tracking-[0.14em] uppercase transition-colors ${
                  view === 'plan' ? 'bg-accent-bright/20 text-accent-bright' : 'text-ink-faint hover:text-ink-dim'
                }`}
              >
                Plan
              </button>
              <button
                type="button"
                onClick={() => setView('profile')}
                className={`rounded px-1.5 py-0.5 font-mono text-[9px] tracking-[0.14em] uppercase transition-colors ${
                  view === 'profile' ? 'bg-accent-bright/20 text-accent-bright' : 'text-ink-faint hover:text-ink-dim'
                }`}
              >
                Profile
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {size !== 'collapsed' && <span className="font-mono text-xs text-accent-bright">{distance}</span>}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={shrink}
              disabled={size === 'collapsed'}
              aria-label="Shrink map"
              className="flex h-6 w-6 items-center justify-center rounded-md text-base leading-none text-ink-dim transition-colors hover:bg-surface hover:text-accent-bright disabled:opacity-30"
            >
              −
            </button>
            <button
              type="button"
              onClick={grow}
              disabled={size === 'expanded'}
              aria-label="Expand map"
              className="flex h-6 w-6 items-center justify-center rounded-md text-base leading-none text-ink-dim transition-colors hover:bg-surface hover:text-accent-bright disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Le plan MapLibre reste TOUJOURS monté (jamais démonté) pour ne
          jamais perdre son cycle de vie/état — juste masqué derrière le
          profil quand l'onglet PROFIL est actif (superposition, pas
          remplacement). */}
      <div className="relative">
        <div ref={containerRef} className={`w-full transition-all duration-300 ${MAP_HEIGHT[size]}`} />
        {view === 'profile' && flight && size !== 'collapsed' && (
          <div className={`absolute inset-0 flex items-center justify-center bg-bg/95 px-2 ${MAP_HEIGHT[size]}`}>
            <LaunchVerticalProfile cut={profile.cut} head={profile.head} />
          </div>
        )}
        {/* Légende du code couleur (Roi/Dame/Pion + faisceau) — sur le PLAN
            seulement (le profil a sa propre lecture), carte non repliée. */}
        {view === 'plan' && size !== 'collapsed' && <TacticalLegend />}
      </div>
    </div>
  )
}
