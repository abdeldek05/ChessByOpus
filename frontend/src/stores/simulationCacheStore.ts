import { create } from 'zustand'
import { simulateFlight, type SimulateRequest, type SimulationResponse } from '@/lib/api'
import { buildSimulationCacheKey } from '@/lib/simulationCacheKey'

interface CacheEntry {
  /** Promise en vol ou déjà résolue pour cette clé — jamais réinitialisée tant
   *  que la clé ne change pas, pour qu'un clic LANCER pendant le calcul
   *  réutilise CETTE requête au lieu d'en déclencher une seconde. */
  promise: Promise<SimulationResponse>
  /** Vague qui a produit ce résultat : sert à savoir si une vague 'gfs' peut
   *  encore arriver et remplacer une entrée 'standard' déjà en cache. */
  wave: 'standard' | 'gfs'
}

interface SimulationCacheState {
  entries: Map<string, CacheEntry>
  /**
   * Précalcule le vol en DEUX VAGUES : d'abord une atmosphère standard
   * (~1 s, jamais bloquée par le réseau) posée en cache immédiatement,
   * puis la météo réelle GFS (~7 s) qui REMPLACE l'entrée dès qu'elle
   * répond. Un clic LANCER pendant la vague 1 obtient un résultat quasi
   * instantané ; s'il attend un peu plus, il obtient la météo réelle.
   * No-op si la clé (payload équivalent) est déjà en cache.
   *
   * `api.ts` (`request`) ne prend pas de signal externe : la requête GFS
   * d'une vague devenue obsolète continue donc en réseau jusqu'à sa fin,
   * mais son résultat n'écrase plus rien dès que la clé n'est plus la clé
   * courante (voir la vérification dans le `.then`) — coût réseau résiduel
   * accepté plutôt que de modifier le client HTTP partagé par tout le front.
   */
  prefetch: (payload: SimulateRequest) => void
  /** Résultat en cache pour ce payload (résolu ou en vol), null si absent —
   *  à consommer par le lancement réel au lieu de rappeler `/simulate`. */
  get: (payload: SimulateRequest) => Promise<SimulationResponse> | null
}

export const useSimulationCacheStore = create<SimulationCacheState>((set, get) => ({
  entries: new Map(),

  prefetch: (payload) => {
    const key = buildSimulationCacheKey(payload)
    if (get().entries.has(key)) return

    // Vague 1 — atmosphère standard : réponse garantie rapide, ne dépend pas
    // du réseau GFS. Valeur explicite (15°C, hypothèse raisonnable au niveau
    // de la mer) pour court-circuiter le chargement météo si l'appelant n'a
    // rien précisé.
    const standardPayload: SimulateRequest = { ...payload, temperatureC: payload.temperatureC ?? 15 }
    const standardPromise = simulateFlight(standardPayload)
    set((state) => {
      const entries = new Map(state.entries)
      entries.set(key, { promise: standardPromise, wave: 'standard' })
      return { entries }
    })

    // Vague 2 — météo réelle GFS : ne se lance que si l'appelant n'a pas
    // explicitement forcé une température (sinon la vague 1 EST déjà le
    // résultat final voulu, pas la peine de refaire un appel réseau).
    if (payload.temperatureC == null) {
      const gfsPromise = simulateFlight(payload)
      gfsPromise
        .then(() => {
          // Ne remplace que si cette clé est toujours en cache (pas
          // invalidée entre-temps par un changement de paramètres).
          if (get().entries.has(key)) {
            set((state) => {
              const entries = new Map(state.entries)
              entries.set(key, { promise: gfsPromise, wave: 'gfs' })
              return { entries }
            })
          }
        })
        .catch(() => {
          // Vague GFS en échec (réseau, timeout) : la vague standard déjà en
          // cache reste le résultat utilisable, rien à faire de plus.
        })
    }
  },

  get: (payload) => {
    const key = buildSimulationCacheKey(payload)
    return get().entries.get(key)?.promise ?? null
  },
}))
