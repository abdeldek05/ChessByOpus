import type { MesangeRole } from '@/types/mission.types'

interface RoleRocketIconProps {
  role: MesangeRole
  className?: string
}

/**
 * Icône de rôle : toujours une fusée-sonde, coiffée d'une couronne selon le
 * rôle — Roi (couronne à pointes), Dame (couronne à perles), Pion (nue).
 */
export function RoleRocketIcon({ role, className }: RoleRocketIconProps) {
  return (
    <svg viewBox="0 0 24 34" className={className} fill="currentColor">
      {role === 'KING' && (
        <path d="M7 8 L7 4 L9.5 6 L12 2.5 L14.5 6 L17 4 L17 8 Z" />
      )}
      {role === 'QUEEN' && (
        <>
          <path d="M7 8 L8 5 L12 6.5 L16 5 L17 8 Z" />
          <circle cx="8" cy="4.4" r="1" />
          <circle cx="12" cy="3.6" r="1.1" />
          <circle cx="16" cy="4.4" r="1" />
        </>
      )}

      {/* Corps de la fusée-sonde */}
      <path d="M12 9 C9.2 11.5 8.2 14.5 8.2 18 L8.2 26 C8.2 28 9.6 29.4 12 30 C14.4 29.4 15.8 28 15.8 26 L15.8 18 C15.8 14.5 14.8 11.5 12 9 Z" />
      {/* Ailerons */}
      <path d="M8.2 24 L5 30 L8.2 27.5 Z" />
      <path d="M15.8 24 L19 30 L15.8 27.5 Z" />
    </svg>
  )
}
