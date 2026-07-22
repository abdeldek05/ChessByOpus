import type { MesangeRole } from '@/types/mission.types'

const ROLE_TEXT_CLASSES: Record<MesangeRole, string> = {
  KING: 'text-role-king',
  QUEEN: 'text-role-queen',
  PAWN: 'text-role-pawn',
}

/** Classe Tailwind de couleur (texte) pour un rôle CHESS — voir les tokens
 *  --color-role-* dans styles/index.css (mêmes teintes que les schémas de
 *  doctrine : Roi rouge, Dame laiton, Pion gris neutre). */
export function getMesangeRoleTextClass(role: MesangeRole): string {
  return ROLE_TEXT_CLASSES[role]
}
