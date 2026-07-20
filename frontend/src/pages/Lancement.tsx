import { Navigate, useLocation } from 'react-router-dom'
import { SceneErrorBoundary } from '@/components/ui/SceneErrorBoundary'
import {
  LancementScene,
  type LancementLocationState,
} from '@/components/sections/Lancement/LancementScene'

/**
 * Page /lancement : garde de route (state de scénario valide) + filet de
 * sécurité (SceneErrorBoundary). Toute la scène est orchestrée par LancementScene.
 */
export function Lancement() {
  const location = useLocation()
  const state = location.state as LancementLocationState | null

  // Garde-fou : sans scénario complet, retour HUD. On valide ici TOUT ce que la
  // scène déréférence sans filet plus bas (position du 1er radar, menaces) —
  // sinon un state malformé (navigation manuelle, replay, payload modifié)
  // ferait planter le render (accès sur null/undefined) au lieu d'un retour propre.
  const firstRadarPlaced = state?.radars?.[0]?.position != null
  const hasThreats = Array.isArray(state?.mesangeConfigs) && state.mesangeConfigs.length > 0
  if (!state?.site || !state.scenarioId || !state.radars?.length || !firstRadarPlaced || !hasThreats) {
    return <Navigate to="/mission" replace />
  }

  // Filet de sécurité : toute exception levée pendant le rendu de la scène (3D,
  // HUD ou carte) affiche un panneau de secours au lieu de blanchir toute l'app.
  return (
    <SceneErrorBoundary label="Scène de lancement interrompue">
      <LancementScene state={state} />
    </SceneErrorBoundary>
  )
}
