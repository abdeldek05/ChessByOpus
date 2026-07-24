import { useState } from 'react'

/** Taille de la carte tactique : repliée (titre seul) → compacte → agrandie. */
export type MapSize = 'collapsed' | 'compact' | 'expanded'

interface UseMapExpansionResult {
  size: MapSize
  /** Agrandit d'un cran (compact → expanded). */
  grow: () => void
  /** Réduit d'un cran (expanded → compact → collapsed). */
  shrink: () => void
}

const ORDER: MapSize[] = ['collapsed', 'compact', 'expanded']

/**
 * État de taille de la carte tactique, sur trois crans. On monte/descend d'un
 * cran à la fois via deux boutons — permet de replier complètement la carte
 * (juste la barre de titre) quand elle gêne.
 */
export function useMapExpansion(): UseMapExpansionResult {
  // Grand format PAR DÉFAUT (avant 'compact') : la carte tactique est
  // désormais la vue principale des leurres (pistes live des Pions/Dame),
  // elle doit être lisible d'emblée sans que l'utilisateur ait à l'agrandir.
  const [size, setSize] = useState<MapSize>('expanded')

  const step = (delta: number) =>
    setSize((current) => ORDER[Math.min(ORDER.length - 1, Math.max(0, ORDER.indexOf(current) + delta))])

  return {
    size,
    grow: () => step(1),
    shrink: () => step(-1),
  }
}
