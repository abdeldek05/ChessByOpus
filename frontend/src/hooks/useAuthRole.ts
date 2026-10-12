import { useAuthStore } from '@/stores/authStore'
import type { AuthRole } from '@/types/auth.types'

/**
 * Rôle de la session en cours, ou `null` si personne n'est connecté (ou si
 * /auth/me n'a pas encore répondu).
 *
 * Un seul endroit lit `user.role` : les onglets et gardes réservés posent la
 * même question, autant qu'ils la posent de la même façon.
 */
export function useAuthRole(): AuthRole | null {
  return useAuthStore((state) => state.user?.role ?? null)
}
