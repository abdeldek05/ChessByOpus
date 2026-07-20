interface RocketInfoCalloutProps {
  elevationDeg: number
  azimuthDeg: number
  /** Portée max estimée (km), null tant que non reçue du backend (affiche « — »). */
  rangeKm: number | null
  roleLabel: string
}

/**
 * Fiche technique du missile posé sur la rampe : rôle, élévation, azimut et
 * portée estimée — 4 lignes, rien de plus (un décideur doit comprendre en un
 * coup d'œil, pas lire un cockpit de données). Ancrée dans l'espace 3D par
 * RocketInfoHologram ; ce composant ne fait que présenter des valeurs déjà
 * calculées.
 *
 * `mix-blend-difference` + BLANC PUR (pas un token doux) : le texte se
 * superpose au canvas 3D dont le fond change constamment (ciel clair, herbe
 * sombre, béton). La différence n'est une VRAIE inversion — donc lisible sur
 * n'importe quel fond — que si la couleur de départ est blanc pur ; un blanc
 * cassé (token --color-ink) donne une inversion incomplète, peu lisible.
 * Opacité pleine partout (pas de dimming sur les labels) : réduire l'opacité
 * réintroduit du fond DERRIÈRE le résultat déjà inversé et casse le contraste.
 */
export function RocketInfoCallout({ elevationDeg, azimuthDeg, rangeKm, roleLabel }: RocketInfoCalloutProps) {
  return (
    <div className="mix-blend-difference w-56 space-y-3 text-right text-white">
      <div>
        <p className="font-fine text-sm font-light tracking-[0.2em] uppercase">Role</p>
        <p className="font-mono text-2xl">{roleLabel}</p>
      </div>
      <div>
        <p className="font-fine text-sm font-light tracking-[0.2em] uppercase">Elevation</p>
        <p className="font-mono text-2xl">{elevationDeg.toFixed(0)}°</p>
      </div>
      <div>
        <p className="font-fine text-sm font-light tracking-[0.2em] uppercase">Azimuth</p>
        <p className="font-mono text-2xl">{azimuthDeg.toFixed(0)}°</p>
      </div>
      <div>
        <p className="font-fine text-sm font-light tracking-[0.2em] uppercase">Est. range</p>
        <p className="font-mono text-2xl">{rangeKm != null ? `≈ ${rangeKm.toFixed(0)} km` : '—'}</p>
      </div>
    </div>
  )
}
