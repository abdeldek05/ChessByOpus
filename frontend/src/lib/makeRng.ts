/**
 * Générateur pseudo-aléatoire DÉTERMINISTE (mulberry32) : même graine → même
 * séquence. Sert à tous les placements/éclats « aléatoires » reproductibles
 * (débris, poussière…) — le rendu est identique d'un rejeu à l'autre.
 */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
