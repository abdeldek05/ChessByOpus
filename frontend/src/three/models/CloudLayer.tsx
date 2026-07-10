import * as THREE from 'three'
import { Clouds, Cloud } from '@react-three/drei'
import { CLOUDS, CLOUD_COLOR, CLOUD_DRIFT_SPEED, CLOUDS_LIMIT } from '@/three/constants/cloudLayer'

/**
 * Couche de nuages golden hour à l'horizon : volumes de billboards doux (drei
 * <Cloud>), teintés chaud, en dérive très lente. Matériau basic (non éclairé) =
 * coût minimal ; la teinte porte la lumière du soir. Placement/réglages dans
 * les constantes — rendu pur ici.
 */
export function CloudLayer() {
  return (
    <Clouds material={THREE.MeshBasicMaterial} limit={CLOUDS_LIMIT}>
      {CLOUDS.map((cloud, index) => (
        <Cloud
          key={index}
          seed={cloud.seed}
          position={cloud.position}
          bounds={cloud.bounds}
          segments={cloud.segments}
          volume={cloud.volume}
          opacity={cloud.opacity}
          color={CLOUD_COLOR}
          speed={CLOUD_DRIFT_SPEED}
          growth={0}
          fade={40}
        />
      ))}
    </Clouds>
  )
}
