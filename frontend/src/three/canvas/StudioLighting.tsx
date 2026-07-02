import { Environment, Lightformer } from '@react-three/drei'

/**
 * Éclairage "studio produit" pour la Mesange : trois lumières directionnelles
 * (clé chaude qui projette l'auto-ombrage, contre-jour froid pour détacher la
 * silhouette, remplissage doré par-dessous) + un environnement de softboxes
 * qui crée des reflets spéculaires nets roulant sur le chrome et l'or quand la
 * fusée tourne. L'environnement est baké une seule fois (frames={1}), donc
 * gratuit en continu.
 */
export function StudioLighting() {
  return (
    <>
      <ambientLight intensity={0.15} />

      <directionalLight
        position={[5, 8, 5]}
        intensity={3.4}
        color="#fff6e8"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-4, 4, 4, -4, 0.1, 30]} />
      </directionalLight>

      <directionalLight position={[-6, 3, -7]} intensity={2.4} color="#a9c4e8" />
      <directionalLight position={[0, -5, 4]} intensity={0.8} color="#e8b870" />

      <Environment frames={1} resolution={512} background={false}>
        <Lightformer form="rect" intensity={6} position={[4, 4, 4]} scale={[5, 9, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={3} position={[-5, 2, 3]} scale={[4, 9, 1]} color="#cfe0ff" />
        <Lightformer form="rect" intensity={4} position={[0, 6, -5]} scale={[10, 4, 1]} color="#ffffff" />
        <Lightformer form="ring" intensity={2.2} position={[0, -1, 7]} scale={4} color="#ffd9a0" />
      </Environment>
    </>
  )
}
