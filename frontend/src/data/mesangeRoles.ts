import type { MesangeRole } from '@/types/mission.types'

interface RoleOption {
  id: MesangeRole
  label: string
  hint: string
  /** Niveau d'importance (3 = menace principale) — rendu en barres discrètes. */
  rank: number
}

export const MESANGE_ROLES: RoleOption[] = [
  { id: 'KING', label: 'King', hint: 'Primary threat', rank: 3 },
  { id: 'QUEEN', label: 'Queen', hint: 'Primary decoy', rank: 2 },
  { id: 'PAWN', label: 'Pawn', hint: 'Saturation decoy', rank: 1 },
]
