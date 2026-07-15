import * as THREE from 'three'

/**
 * Déplace en hauteur les sommets d'une géométrie plane (créée dans le plan XY,
 * destinée à être tournée de -90° autour de X à l'affichage) : pour chaque
 * sommet, l'axe Z LOCAL — qui deviendra la hauteur MONDE — reçoit
 * `height(x, zMonde)`, où `zMonde = -yLocal`. Recalcule les normales.
 *
 * Fonction pure d'effet de bord sur la géométrie fournie (mute en place, pas de
 * copie), utilisée par les hooks de génération de terrain pour rester courts.
 */
export function displaceGeometry(
  geometry: THREE.BufferGeometry,
  height: (x: number, z: number) => number,
): void {
  const positions = geometry.attributes.position
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i)
    const y = positions.getY(i)
    positions.setZ(i, height(x, -y))
  }
  positions.needsUpdate = true
  geometry.computeVertexNormals()
}
