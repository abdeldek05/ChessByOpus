/** Mises en forme de l'onglet Admin. Fonctions pures : aucun state, aucun effet. */

import type { LoginFailureReason } from '@/types/admin.types'

/** Date/heure courte, en heure locale : « 28/07 17:22 ». */
export function formatEventDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Durée lisible : « 4 h 12 », « 38 min », « 45 s ». */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${Math.max(0, Math.round(totalSeconds))} s`
  const minutes = Math.floor(totalSeconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `${hours} h ${String(minutes % 60).padStart(2, '0')}`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  const kilobytes = bytes / 1024
  if (kilobytes < 1024) return `${kilobytes.toFixed(0)} Ko`
  return `${(kilobytes / 1024).toFixed(1)} Mo`
}

const FAILURE_LABELS: Record<LoginFailureReason, string> = {
  unknown_user: 'Identifiant inconnu',
  bad_password: 'Mot de passe faux',
  rate_limited: 'Bloqué (trop d’essais)',
}

export function formatFailureReason(reason: LoginFailureReason | null): string {
  if (reason === null) return 'Connexion réussie'
  return FAILURE_LABELS[reason] ?? reason
}

/**
 * Navigateur + OS depuis un User-Agent. Volontairement approximatif : on veut
 * reconnaître « c'était bien moi, sur mon poste », pas faire du profilage.
 */
export function formatUserAgent(userAgent: string): string {
  if (!userAgent) return 'Inconnu'

  const browser =
    /Edg\//.test(userAgent) ? 'Edge'
    : /OPR\//.test(userAgent) ? 'Opera'
    : /Chrome\//.test(userAgent) ? 'Chrome'
    : /Safari\//.test(userAgent) ? 'Safari'
    : /Firefox\//.test(userAgent) ? 'Firefox'
    : 'Autre'

  const os =
    /Windows/.test(userAgent) ? 'Windows'
    : /Android/.test(userAgent) ? 'Android'
    : /iPhone|iPad/.test(userAgent) ? 'iOS'
    : /Mac OS X/.test(userAgent) ? 'macOS'
    : /Linux/.test(userAgent) ? 'Linux'
    : '—'

  return `${browser} · ${os}`
}
