import { useCallback } from 'react'
import {
  PLOT_TRACE_WIDTH,
  PLOT_SEEN_WIDTH,
  PLOT_DECOY_WIDTH,
  PLOT_TRACE_ACTIVE_WIDTH,
  PLOT_SEEN_ACTIVE_WIDTH,
  PLOT_DECOY_ACTIVE_WIDTH,
  PLOT_DIMMED_OPACITY,
} from '@/three/constants/trajectoryPlot'
import { isSameSelection, type ProfileSelection } from '@/types/coverageProfile.types'

/** Style de rendu d'une courbe du profil, dérivé de l'état de sélection. */
export interface ProfileCurveStyle {
  lineWidth: number
  /** Toujours `true` : drei `<Line>` ignore `opacity` sans `transparent`. */
  transparent: true
  opacity: number
}

/** Largeurs (repos, sélectionnée) par famille de courbe. */
const WIDTHS = {
  king: [PLOT_TRACE_WIDTH, PLOT_TRACE_ACTIVE_WIDTH],
  radar: [PLOT_SEEN_WIDTH, PLOT_SEEN_ACTIVE_WIDTH],
  decoy: [PLOT_DECOY_WIDTH, PLOT_DECOY_ACTIVE_WIDTH],
} as const

/**
 * Traduit l'état de sélection du profil de couverture en style de trait, pour
 * TOUTES les courbes du graphe. Trois états seulement :
 *
 * - aucune sélection  → tout au repos (traits fins, pleine opacité) ;
 * - courbe choisie    → trait épaissi, pleine opacité ;
 * - courbe non choisie → trait fin, estompé (le contexte reste lisible).
 *
 * Centraliser la règle ici évite de la réécrire à chaque `<Line>` du JSX (le
 * graphe en compte quatre familles) et garantit qu'elles réagissent toutes de la
 * même façon.
 */
export function useProfileCurveStyle(selection: ProfileSelection) {
  return useCallback(
    (curve: NonNullable<ProfileSelection>, baseOpacity = 1): ProfileCurveStyle => {
      const [restWidth, activeWidth] = WIDTHS[curve.kind]
      if (selection === null) {
        return { lineWidth: restWidth, transparent: true, opacity: baseOpacity }
      }
      const isActive = isSameSelection(selection, curve)
      return {
        lineWidth: isActive ? activeWidth : restWidth,
        transparent: true,
        opacity: isActive ? 1 : baseOpacity * PLOT_DIMMED_OPACITY,
      }
    },
    [selection],
  )
}
