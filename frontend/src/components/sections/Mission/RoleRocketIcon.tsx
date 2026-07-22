import type { MesangeRole } from '@/types/mission.types'

interface RoleRocketIconProps {
  role: MesangeRole
  className?: string
}

/**
 * Icône de rôle : une fusée-SONDE (silhouette fine et élancée, ogive
 * effilée — mêmes proportions que SoundingRocket2D, la référence visuelle du
 * sujet réel) coiffée d'une couronne selon le rôle — Roi (couronne à
 * pointes), Dame (couronne à perles), Pion (nue). Corps mince, PAS une fusée
 * spatiale trapue.
 */
export function RoleRocketIcon({ role, className }: RoleRocketIconProps) {
  return (
    <svg viewBox="0 0 24 34" className={className} fill="currentColor" strokeLinejoin="round">
      {role === 'KING' && <path d="M8 8.5 L8 5 L10 6.7 L12 3.5 L14 6.7 L16 5 L16 8.5 Z" />}
      {role === 'QUEEN' && (
        <>
          <path d="M8 8.5 L8.8 5.8 L12 7 L15.2 5.8 L16 8.5 Z" />
          <circle cx="8.8" cy="5.2" r="0.85" />
          <circle cx="12" cy="4.5" r="0.95" />
          <circle cx="15.2" cy="5.2" r="0.85" />
        </>
      )}

      {/* Ailerons discrets */}
      <path d="M9.3 24.5 L6.5 30 L9.3 27.8 Z" opacity="0.85" />
      <path d="M14.7 24.5 L17.5 30 L14.7 27.8 Z" opacity="0.85" />

      {/* Corps très mince */}
      <rect x="9.3" y="12.5" width="5.4" height="15" rx="2.7" />

      {/* Ogive effilée */}
      <path d="M9.3 12.5 Q12 8.5 14.7 12.5 Z" />
    </svg>
  )
}
