interface FlightAltitudeCalloutProps {
  /** Élément qui reçoit le texte de l'altitude, écrit hors React à cadence
   *  réduite (voir KingAltitudeTag) — un chiffre qui change 10 fois par seconde
   *  ne doit pas déclencher de re-render pendant le vol. */
  valueRef: React.RefObject<HTMLParagraphElement | null>
}

/**
 * Altitude LIVE de la menace en vol : du TEXTE NU posé sur la scène, aucun
 * panneau, aucun cadre, aucun fond — exactement comme la fiche du missile sur la
 * rampe (voir RocketInfoCallout), dont il reprend aussi la typographie (label fin
 * en capitales espacées, valeur en mono large). L'écran garde ainsi un seul
 * langage visuel du pas de tir jusqu'à l'impact.
 *
 * `mix-blend-difference` + BLANC PUR, pour la même raison qu'à la rampe : le
 * texte se superpose à un canvas dont le fond change en permanence (ciel clair,
 * relief sombre, panache lumineux). L'inversion par différence reste lisible sur
 * TOUS ces fonds sans ajouter la moindre ornementation — mais seulement si la
 * couleur de départ est un blanc pur (un blanc cassé donne une inversion
 * incomplète), et sans jamais baisser l'opacité (cela réintroduirait du fond
 * derrière le résultat déjà inversé et casserait le contraste).
 */
export function FlightAltitudeCallout({ valueRef }: FlightAltitudeCalloutProps) {
  return (
    <div className="mix-blend-difference w-36 text-left text-white">
      <p className="font-fine text-sm font-light tracking-label uppercase">Altitude</p>
      <p ref={valueRef} className="type-readout" />
    </div>
  )
}
