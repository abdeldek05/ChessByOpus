import type { MesangeRole } from '@/types/mission.types'

const ROLE_LABELS: Record<MesangeRole, string> = {
  KING: 'King',
  QUEEN: 'Main decoy',
  PAWN: 'Decoy',
}

/** Libellé court du rôle d'une Mesange, pour affichage HUD (UI en anglais). */
export function getMesangeRoleLabel(role: MesangeRole | undefined): string {
  return role ? ROLE_LABELS[role] : '—'
}
