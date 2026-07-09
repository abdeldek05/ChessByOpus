interface SoundingRocket2DProps {
  /** Position du pivot (base de la fusée) dans le viewBox. */
  pivotX: number
  pivotY: number
  /** Longueur totale de la fusée, du pivot à la pointe de l'ogive. */
  length: number
}

/**
 * Fusée-sonde stylisée en 2D, fine et élancée, dessinée verticale (pointe vers
 * le haut) depuis le pivot. Silhouette délicate : corps très mince, ogive
 * laiton effilée, ailerons discrets. La rotation (élévation) est appliquée par
 * le parent : ce composant ne connaît que sa géométrie.
 */
export function SoundingRocket2D({ pivotX, pivotY, length }: SoundingRocket2DProps) {
  // Proportions relatives à la longueur : corps très fin, ogive longue.
  const w = length * 0.055 // demi-largeur du corps
  const noseLen = length * 0.28
  const bodyLen = length - noseLen
  const topY = pivotY - length // pointe de l'ogive
  const bodyTopY = pivotY - bodyLen // jonction corps / ogive
  const finTopY = pivotY - bodyLen * 0.28 // haut des ailerons

  return (
    <g strokeLinejoin="round">
      {/* Ailerons discrets */}
      <path
        d={`M ${pivotX - w} ${finTopY} L ${pivotX - w * 2.6} ${pivotY} L ${pivotX - w} ${pivotY} Z`}
        fill="var(--color-accent)"
        opacity="0.85"
      />
      <path
        d={`M ${pivotX + w} ${finTopY} L ${pivotX + w * 2.6} ${pivotY} L ${pivotX + w} ${pivotY} Z`}
        fill="var(--color-accent)"
        opacity="0.85"
      />

      {/* Corps mince */}
      <rect x={pivotX - w} y={bodyTopY} width={w * 2} height={bodyLen} rx={w} fill="var(--color-ink)" />

      {/* Ogive laiton effilée */}
      <path
        d={`M ${pivotX - w} ${bodyTopY} Q ${pivotX} ${topY} ${pivotX + w} ${bodyTopY} Z`}
        fill="var(--color-accent-bright)"
      />
    </g>
  )
}
