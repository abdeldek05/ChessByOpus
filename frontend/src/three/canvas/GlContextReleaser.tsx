import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

/**
 * Libère IMMÉDIATEMENT le contexte WebGL au démontage du <Canvas>.
 *
 * R3F « dispose » bien le renderer, mais ne relâche pas le contexte GPU tout de
 * suite (GC différé du navigateur). Sous StrictMode (double montage), HMR Vite et
 * navigation entre routes, les contextes orphelins s'accumulent jusqu'au plafond
 * navigateur (~8-16) — le navigateur tue alors en boucle le plus ancien contexte
 * (`Context Lost` jamais restauré, canvas blanc). `forceContextLoss()` coupe court
 * en rendant le contexte au pilote dès le démontage.
 *
 * À monter à l'intérieur de CHAQUE <Canvas>.
 */
export function GlContextReleaser() {
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    return () => {
      try {
        gl.forceContextLoss()
        gl.dispose()
      } catch {
        // Contexte déjà perdu : rien à libérer, on ignore.
      }
    }
  }, [gl])

  return null
}
