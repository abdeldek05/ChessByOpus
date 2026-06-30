// Codes météo OMM (norme utilisée par Open-Meteo) regroupés par famille.
const WEATHER_LABELS: Record<number, string> = {
  0: "Ciel dégagé",
  1: "Plutôt dégagé",
  2: "Partiellement nuageux",
  3: "Couvert",
  45: "Brouillard",
  48: "Brouillard givrant",
  51: "Bruine légère",
  53: "Bruine",
  55: "Bruine dense",
  61: "Pluie légère",
  63: "Pluie",
  65: "Pluie forte",
  71: "Neige légère",
  73: "Neige",
  75: "Neige forte",
  80: "Averses légères",
  81: "Averses",
  82: "Averses violentes",
  95: "Orage",
  96: "Orage avec grêle",
  99: "Orage violent",
};

/** Libellé lisible pour un code météo OMM (Open-Meteo). */
export function describeWeatherCode(code: number): string {
  return WEATHER_LABELS[code] ?? "Conditions inconnues";
}
