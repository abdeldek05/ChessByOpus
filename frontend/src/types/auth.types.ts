/** Contrats de données de l'authentification (côté client). */

/**
 * Rôle du compte connecté, tel que renvoyé par le back.
 *
 * `admin` = opérateur complet (simulation + onglet Admin).
 * `guest` = invité : la chaîne de simulation, rien d'autre.
 */
export type AuthRole = 'admin' | 'guest'

export interface AuthUser {
  username: string
  role: AuthRole
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
