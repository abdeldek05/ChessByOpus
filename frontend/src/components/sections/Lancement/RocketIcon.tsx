import type { CSSProperties } from 'react'

interface RocketIconProps {
  className?: string
  /** Position calculée dynamiquement (voir SceneLoadingOverlay) — seule exception au style inline (CLAUDE.md). */
  style?: CSSProperties
}

/**
 * Fusée vectorielle simple (fuselage + ailerons + hublot), orientée vers la
 * droite — sens de déplacement de la pastille sur la piste de progression
 * (voir SceneLoadingOverlay). Remplace l'emoji 🚀 (rendu incohérent selon
 * l'OS/la police système) par un tracé maîtrisé, teinté via currentColor.
 */
export function RocketIcon({ className, style }: RocketIconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
      {/* Fuselage horizontal + nez conique, pointant vers la droite (sens de
          déplacement sur la piste). */}
      <path d="M2 12c3-2.6 6.6-4 11-4h4l3 4-3 4h-4c-4.4 0-8-1.4-11-4Z" />
      {/* Ailerons arrière (haut/bas), symétriques. */}
      <path d="M6.5 9.2 4 5.5c-.2-.3.1-.7.5-.6l4.6 1.4-2.6 2.9Z" />
      <path d="M6.5 14.8 4 18.5c-.2.3.1.7.5.6l4.6-1.4-2.6-2.9Z" />
      {/* Hublot. */}
      <circle cx="15.5" cy="12" r="1.5" fill="var(--color-bg)" />
    </svg>
  )
}
