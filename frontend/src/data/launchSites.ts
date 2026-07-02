import type { LaunchSite } from '@/types/simulation.types'

export const launchSites: LaunchSite[] = [
  {
    id: 'ile-du-levant',
    name: 'Île du Levant',
    operator: 'DGA Essais de Missiles',
    country: 'FR',
    latitude: 43.046386,
    longitude: 6.510068,
    elevation: 50,
    timezone: 'Europe/Paris',
    active: true,
  },
  {
    id: 'biscarrosse',
    name: 'Biscarrosse',
    operator: 'DGA Essais en Vol',
    country: 'FR',
    latitude: 44.36724,
    longitude: -1.26011,
    elevation: 20,
    timezone: 'Europe/Paris',
    active: true,
  },
  {
    id: 'esrange',
    name: 'Esrange (Kiruna)',
    operator: 'SSC Esrange Space Center',
    country: 'SE',
    latitude: 67.892841,
    longitude: 21.105608,
    elevation: 320,
    timezone: 'Europe/Stockholm',
    active: false,
  },
  {
    id: 'saxavord',
    name: 'Saxavord (Écosse)',
    operator: 'SaxaVord Spaceport',
    country: 'GB',
    latitude: 60.816948,
    longitude: -0.762307,
    elevation: 100,
    timezone: 'Europe/London',
    active: false,
  },
  {
    id: 'andoya',
    name: 'Andøya — ISAR Spaceport',
    operator: 'Andøya Space',
    country: 'NO',
    latitude: 69.108608,
    longitude: 15.588737,
    elevation: 15,
    timezone: 'Europe/Oslo',
    active: false,
  },
]

/** Sites sélectionnables pour composer un scénario (MVP : 2 actifs). */
export const activeLaunchSites = launchSites.filter((site) => site.active)
