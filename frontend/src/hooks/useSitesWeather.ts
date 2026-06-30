import { useEffect, useState } from "react";
import { launchSites } from "@/data/launchSites";
import type { SiteWeather } from "@/types/weather.types";

const WEATHER_FIELDS = "temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m";

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
  };
}

async function fetchSiteWeather(latitude: number, longitude: number): Promise<SiteWeather | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=${WEATHER_FIELDS}&timezone=auto`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = (await response.json()) as OpenMeteoResponse;
  return {
    temperatureC: data.current.temperature_2m,
    windSpeedKmh: data.current.wind_speed_10m,
    humidityPercent: data.current.relative_humidity_2m,
    weatherCode: data.current.weather_code,
  };
}

/**
 * Récupère la météo actuelle de chaque site de lancement, une seule fois au
 * montage (API Open-Meteo, gratuite et sans clé). Le survol d'un marqueur
 * affiche alors la donnée instantanément, sans requête à la volée.
 */
export function useSitesWeather(): Record<string, SiteWeather | null> {
  const [weatherBySiteId, setWeatherBySiteId] = useState<Record<string, SiteWeather | null>>({});

  useEffect(() => {
    let cancelled = false;

    Promise.all(
      launchSites.map(async (site) => {
        const weather = await fetchSiteWeather(site.latitude, site.longitude).catch(() => null);
        return [site.id, weather] as const;
      }),
    ).then((entries) => {
      if (!cancelled) setWeatherBySiteId(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return weatherBySiteId;
}
