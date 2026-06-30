import { useEffect, useState } from "react";

/** Renvoie l'heure UTC courante (HH:MM:SS), rafraîchie chaque seconde. */
export function useHudClock(): string {
  const [time, setTime] = useState(() => new Date().toISOString().slice(11, 19));

  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toISOString().slice(11, 19)), 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}
