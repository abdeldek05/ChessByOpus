import type { LaunchSite } from "@/types/simulation.types";

export const launchSites: LaunchSite[] = [
  {
    id: "ile-du-levant",
    name: "Île du Levant",
    operator: "DGA Essais de Missiles",
    country: "FR",
    latitude: 43.046386,
    longitude: 6.510068,
    elevation: 50,
    timezone: "Europe/Paris",
  },
  {
    id: "biscarrosse",
    name: "Biscarrosse",
    operator: "DGA Essais en Vol",
    country: "FR",
    latitude: 44.36724,
    longitude: -1.26011,
    elevation: 20,
    timezone: "Europe/Paris",
  },
];
