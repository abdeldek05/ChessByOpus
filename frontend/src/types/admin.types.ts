/** Contrats de données de l'onglet Admin (miroir de /admin/overview). */

/** Motifs d'échec renvoyés par le back (`auth/store.py`). */
export type LoginFailureReason = 'unknown_user' | 'bad_password' | 'rate_limited'

export interface LoginEvent {
  id: number
  username: string
  ip: string
  userAgent: string
  success: boolean
  failureReason: LoginFailureReason | null
  createdAt: string
}

export interface ActiveSession {
  jti: string
  username: string
  ip: string
  userAgent: string
  createdAt: string
  expiresAt: string
}

export interface AdminSecurity {
  loginEvents: LoginEvent[]
  recentFailures: number
  activeSessions: ActiveSession[]
  /** Session de l'admin qui consulte — marquée « vous » et non révocable. */
  currentJti: string
  callerIp: string
}

export interface NamedCount {
  name: string
  count: number
}

export interface TimelinePoint {
  day: string
  count: number
}

export interface RadarUsage {
  templateId: string
  count: number
}

export interface RoleCount {
  role: string
  count: number
}

export interface AdminActivity {
  totals: { missions: number; scenarios: number }
  topSites: NamedCount[]
  timeline: TimelinePoint[]
  radarUsage: RadarUsage[]
  roles: RoleCount[]
  averageFleetSize: number
}

export interface AdminSystem {
  startedAt: string
  uptimeSeconds: number
  simulateCount: number
  simulateFailures: number
  simulateAverageSeconds: number | null
  lastSuccessAt: string | null
  lastFailureAt: string | null
  lastFailureError: string | null
  databaseBytes: number
}

export interface AdminOverview {
  security: AdminSecurity
  activity: AdminActivity
  system: AdminSystem
}
