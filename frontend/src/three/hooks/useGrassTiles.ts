import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { GRASS_TILE_SIZE, GRASS_STREAM_RADIUS } from '@/three/constants/grassField'

export interface GrassTileKey {
  tileX: number
  tileZ: number
}

/**
 * Streaming de tuiles d'herbe autour de la CAMÉRA : recalcule la liste des
 * tuiles actives (celles dont le centre est à moins de GRASS_STREAM_RADIUS de
 * la caméra) uniquement quand la caméra change de tuile — pas à chaque frame.
 * C'est ce qui permet une densité uniforme et dense PARTOUT sur la map sans
 * jamais charger plus qu'un voisinage borné autour du joueur.
 */
export function useGrassTiles(): GrassTileKey[] {
  const [tiles, setTiles] = useState<GrassTileKey[]>([])
  const lastTileRef = useRef<{ x: number; z: number } | null>(null)

  useFrame(({ camera }) => {
    const camTileX = Math.floor(camera.position.x / GRASS_TILE_SIZE)
    const camTileZ = Math.floor(camera.position.z / GRASS_TILE_SIZE)

    const last = lastTileRef.current
    if (last && last.x === camTileX && last.z === camTileZ) return // même tuile : rien à refaire.
    lastTileRef.current = { x: camTileX, z: camTileZ }

    const radiusInTiles = Math.ceil(GRASS_STREAM_RADIUS / GRASS_TILE_SIZE)
    const next: GrassTileKey[] = []
    for (let dz = -radiusInTiles; dz <= radiusInTiles; dz++) {
      for (let dx = -radiusInTiles; dx <= radiusInTiles; dx++) {
        const tileX = camTileX + dx
        const tileZ = camTileZ + dz
        // Distance du CENTRE de la tuile à la caméra (cercle, pas carré) :
        // évite de charger les coins du carré de tuiles, hors du rayon voulu.
        const centerX = (tileX + 0.5) * GRASS_TILE_SIZE
        const centerZ = (tileZ + 0.5) * GRASS_TILE_SIZE
        const dist = Math.hypot(centerX - camera.position.x, centerZ - camera.position.z)
        if (dist <= GRASS_STREAM_RADIUS) next.push({ tileX, tileZ })
      }
    }
    setTiles(next)
  })

  return tiles
}
