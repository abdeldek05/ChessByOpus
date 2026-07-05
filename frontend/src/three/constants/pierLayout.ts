import { BLOCK, PIER_ROWS, PIER_BLOCKS_PER_ROW, PIER_CENTER_X, SLAB } from './launcherRig'

// Placement de chaque bloc béton des deux piliers : léger désalignement et
// teinte variable par bloc (déterministes, dérivés de l'index) pour casser
// l'aspect « boîtes parfaites » d'un empilement réel.

export interface PierBlockPlacement {
  position: [number, number, number]
  rotationY: number
  tint: string
}

const TINTS = ['#ffffff', '#f3f4f1', '#e9ebe7', '#f9f9f7']

function buildPierBlocks(): PierBlockPlacement[] {
  const blocks: PierBlockPlacement[] = []
  for (const side of [-1, 1]) {
    for (let row = 0; row < PIER_ROWS; row++) {
      for (let slot = 0; slot < PIER_BLOCKS_PER_ROW; slot++) {
        const index = blocks.length
        const jitterX = (((index * 7) % 5) - 2) * 0.012
        const jitterZ = (((index * 11) % 5) - 2) * 0.01
        blocks.push({
          position: [
            side * PIER_CENTER_X + jitterX,
            SLAB.height + (row + 0.5) * BLOCK.height,
            (slot - (PIER_BLOCKS_PER_ROW - 1) / 2) * BLOCK.depth + jitterZ,
          ],
          rotationY: (((index * 3) % 3) - 1) * 0.014,
          tint: TINTS[index % TINTS.length],
        })
      }
    }
  }
  return blocks
}

export const PIER_BLOCKS: PierBlockPlacement[] = buildPierBlocks()
