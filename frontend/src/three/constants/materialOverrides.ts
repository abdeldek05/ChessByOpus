export interface MaterialOverride {
  metalness?: number
  roughness?: number
}

/**
 * Le bake Blender du modèle Mesange laisse plusieurs matériaux sans valeur
 * de rugosité/métallicité explicite. La norme glTF retombe alors sur
 * roughness=1 (mat, aucun reflet) — ce qui rend chrome/métal/aileron
 * visuellement plats malgré leur nom. On corrige ici au rendu, sans
 * dépendre d'un nouvel export Blender.
 */
export const MATERIAL_REFLECTIVITY_OVERRIDES: Record<string, MaterialOverride> = {
  Fusee_Chrome: { metalness: 1, roughness: 0.05 },
  Fusee_ChromeBrillant: { metalness: 1, roughness: 0.08 },
  Fusee_MetalBrosse: { metalness: 0.85, roughness: 0.32 },
  Fusee_PointeAlternee: { metalness: 0.6, roughness: 0.35 },
  Fusee_Or: { metalness: 1, roughness: 0.25 },
  Fusee_AileronMatFonce: { metalness: 0, roughness: 0.62 },
}
