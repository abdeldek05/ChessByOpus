/** Contrats de données de l'authentification (côté client). */

/**
 * Espace ouvert par la session.
 *
 * `operator` = compte de travail, accès complet (onglet Admin inclus).
 * `guest` = espace invité de démonstration, sans l'onglet Admin.
 *
 * Le rôle vient du serveur à chaque /auth/me : le front ne le déduit jamais de
 * l'identifiant, et le masquage d'un onglet reste du confort — la vraie règle
 * est appliquée par l'API (403).
 */
export type AuthRole = 'operator' | 'guest'

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
