// Flamme moteur de la Mesange en vol : petite sphère émissive + point light,
// positionnée à la base du modèle (nacelle moteur), visible seulement pendant
// la phase propulsée (montée), éteinte en vol balistique/retombée.

// Décalage sous le centre du modèle (~moitié de sa hauteur, cf. ROCKET_FALLBACK_HALF_HEIGHT).
export const ENGINE_FLAME = {
  offsetY: -2.85,
  coreRadius: 0.24,
  coreColor: '#fff4d6',
  coreEmissive: '#ffb347',
  lightColor: '#ff9d42',
  lightIntensity: 7,
  lightDistance: 16,
  flickerSpeed: 18,
  flickerAmount: 0.18,
}
