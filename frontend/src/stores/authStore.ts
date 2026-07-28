import { create } from 'zustand'
import { fetchCurrentUser, login, logout } from '@/lib/api'
import type { AuthStatus, AuthUser, LoginCredentials } from '@/types/auth.types'

/**
 * Session de l'opérateur. Ne contient JAMAIS le jeton : il vit dans un cookie
 * `HttpOnly` que le navigateur joint tout seul aux requêtes et que le
 * JavaScript ne peut pas lire. Ce store ne garde que l'identité affichable.
 */
interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  /** Demande au serveur qui est connecté — appelé une fois au démarrage. */
  restore: () => Promise<void>
  signIn: (credentials: LoginCredentials) => Promise<void>
  signOut: () => Promise<void>
  /** Repasse en `anonymous` — utilisé quand le serveur renvoie 401. */
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'unknown',
  user: null,

  restore: async () => {
    try {
      const user = await fetchCurrentUser()
      set({ status: 'authenticated', user })
    } catch {
      // 401 (pas de session) comme back injoignable : dans les deux cas on ne
      // peut rien faire d'authentifié, donc on affiche le formulaire.
      set({ status: 'anonymous', user: null })
    }
  },

  signIn: async (credentials) => {
    // L'erreur remonte volontairement à l'appelant (useLoginForm) : c'est lui
    // qui sait comment l'afficher dans le formulaire.
    const user = await login(credentials)
    set({ status: 'authenticated', user })
  },

  signOut: async () => {
    try {
      await logout()
    } finally {
      // Même si l'appel échoue, on considère l'utilisateur déconnecté côté UI :
      // le contraire l'enfermerait dans une session qu'il vient de quitter.
      set({ status: 'anonymous', user: null })
    }
  },

  clear: () => set({ status: 'anonymous', user: null }),
}))
