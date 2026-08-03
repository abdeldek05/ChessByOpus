import type { AuthUser } from '@/types/auth.types'

/**
 * Ce compte peut-il ouvrir l'onglet Admin ?
 *
 * Comparaison stricte au rôle `admin` : un utilisateur absent, un rôle inconnu
 * ou un back plus ancien qui ne renvoie pas encore le champ répondent tous
 * « non ». Une garde d'accès doit échouer du côté fermé.
 *
 * Ce test soigne l'affichage — le back applique la même règle (403 sur
 * /admin/*), et c'est LUI qui protège réellement les données.
 */
export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === 'admin'
}
