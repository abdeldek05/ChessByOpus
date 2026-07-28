/** Contrats de données de l'authentification (côté client). */

export interface AuthUser {
  username: string
}

export interface LoginCredentials {
  username: string
  password: string
}

/**
 * `unknown` = on n'a pas encore demandé au serveur qui est connecté.
 *
 * Cet état est indispensable : sans lui, un rechargement de page afficherait le
 * formulaire de connexion une fraction de seconde avant que /auth/me réponde,
 * et une session valide serait vécue comme une déconnexion intempestive.
 */
export type AuthStatus = 'unknown' | 'authenticated' | 'anonymous'
