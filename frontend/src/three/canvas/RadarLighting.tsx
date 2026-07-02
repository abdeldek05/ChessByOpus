import { Environment, Lightformer } from '@react-three/drei'

/**
 * Éclairage neutre pour les radars (matériaux mats kaki/gris), distinct du
 * studio doré/chromé de la Mesange : tons froids et blancs, pas de teinte
 * laiton qui plaquerait une couleur "produit" sur du matériel tactique.
 */
export function RadarLighting() {
  return (
    <>
      <ambientLight intensity={0.25} />

      <directionalLight
        position={[5, 8, 5]}
        intensity={2.6}
        color="#f4f6fb"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      >
        <orthographicCamera attach="shadow-camera" args={[-4, 4, 4, -4, 0.1, 30]} />
      </directionalLight>

      <directionalLight position={[-6, 3, -7]} intensity={1.6} color="#9fb3cc" />
      <directionalLight position={[0, -5, 4]} intensity={0.5} color="#cdd3da" />

      <Environment frames={1} resolution={512} background={false}>
        <Lightformer form="rect" intensity={4} position={[4, 4, 4]} scale={[5, 9, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={2.5} position={[-5, 2, 3]} scale={[4, 9, 1]} color="#dbe4f2" />
        <Lightformer form="rect" intensity={3} position={[0, 6, -5]} scale={[10, 4, 1]} color="#ffffff" />
      </Environment>
    </>
  )
}
