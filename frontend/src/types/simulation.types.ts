export interface LaunchSite {
  id: string
  name: string
  operator: string
  country: string
  latitude: number
  longitude: number
  elevation: number
  timezone: string
  /** Site opérationnel pour le MVP (seuls les actifs sont sélectionnables). */
  active: boolean
}
