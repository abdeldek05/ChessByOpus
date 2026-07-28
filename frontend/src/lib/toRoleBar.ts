import { getMesangeRoleLabel } from './getMesangeRoleLabel'
import type { MesangeRole } from '@/types/mission.types'
import type { RoleCount } from '@/types/admin.types'

const KNOWN_ROLES: MesangeRole[] = ['KING', 'QUEEN', 'PAWN']

/**
 * Convertit un décompte de rôles renvoyé par le back en barre affichable.
 *
 * Le back renvoie le rôle TEL QU'IL A ÉTÉ ENREGISTRÉ : un scénario d'archive
 * peut porter une valeur hors de la nomenclature actuelle. On l'affiche alors
 * brute plutôt que sous un « — » qui ferait disparaître la donnée.
 */
export function toRoleBar(entry: RoleCount): { label: string; count: number } {
  const isKnown = (KNOWN_ROLES as string[]).includes(entry.role)
  return {
    label: isKnown ? getMesangeRoleLabel(entry.role as MesangeRole) : entry.role,
    count: entry.count,
  }
}
