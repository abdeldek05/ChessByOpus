import type { MesangeRole } from '@/types/mission.types'

interface RoleOption {
  id: MesangeRole
  label: string
  hint: string
  /** Niveau d'importance (3 = menace principale) — rendu en barres discrètes. */
  rank: number
}

export const MESANGE_ROLES: RoleOption[] = [
  { id: 'KING', label: 'Roi', hint: 'Menace principale', rank: 3 },
  { id: 'QUEEN', label: 'Dame', hint: 'Leurre principal', rank: 2 },
  { id: 'PAWN', label: 'Pion', hint: 'Leurre de saturation', rank: 1 },
]
