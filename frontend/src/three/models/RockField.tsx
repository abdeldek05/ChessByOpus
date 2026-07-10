import { Rock } from './Rock'
import { sampleLawnRelief } from '@/lib/sampleLawnRelief'
import { ROCKS } from '@/three/constants/rocks'

/**
 * Ensemble des rochers du décor : groupés sur la berge de l'étang et épars dans
 * le champ (cf. constantes ROCKS). Chaque rocher est posé au ras du relief à sa
 * position, légèrement enfoncé pour l'asseoir. Orchestration seule.
 */
export function RockField() {
  return (
    <group>
      {ROCKS.map((rock, i) => {
        const [x, z] = rock.pos
        const y = sampleLawnRelief(x, z) - rock.sink
        return <Rock key={i} position={[x, y, z]} radius={rock.radius} seed={rock.seed} />
      })}
    </group>
  )
}
