import { ConcreteSlab } from './ConcreteSlab'
import { ConcretePiers } from './ConcretePiers'
import { LaunchDeck } from './LaunchDeck'
import { DeckRailing } from './DeckRailing'
import { GuideRailMast } from './GuideRailMast'
import { AccessLadder } from './AccessLadder'
import { WindFlag } from './WindFlag'

/**
 * Banc de tir complet : dalle, piliers béton, plateau, garde-corps, mât-rail,
 * échelle et drapeau. La fusée est posée séparément par RocketOnLauncher.
 */
export function LauncherRig() {
  return (
    <group>
      <ConcreteSlab />
      <ConcretePiers />
      <LaunchDeck />
      <DeckRailing />
      <GuideRailMast />
      <AccessLadder />
      <WindFlag />
    </group>
  )
}
