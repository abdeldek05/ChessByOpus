// Fragment de splatting du biome DÉSERT : mélange « terre dominante » —
// copie CONFORME de l'ancien fragment unique, pour que midāna ne change pas
// d'un pixel pendant que la prairie passe au gazon (terrainShaders.ts).
// La refonte visuelle du désert viendra plus tard, séparément.
import { TERRAIN_SHADER_LIB } from '@/three/constants/terrainShaderLib'

// Réglages du splatting désert (valeurs des uniforms). En UNITÉS SCÈNE (1 u = 8 m).
export const SPLAT_CONFIG_DESERT = {
  /** Unités monde couvertes par une tuile de texture (taille apparente du grain). */
  texScale: 12,
  /** Seuil de pente (normale.y) sous lequel la roche apparaît. */
  rockSlope: 0.72,
  /** Altitude (unités) à partir de laquelle la roche/sécheresse gagne (méga-dunes). */
  highAltitude: 22,
  /** Échelle des plaques de dominante. */
  patchScale: 90,
} as const

export const TERRAIN_FRAGMENT_DESERT = /* glsl */ `
  uniform sampler2D uDirt;
  uniform sampler2D uDarkEarth;
  uniform sampler2D uGrass;
  uniform sampler2D uDryGrass;
  uniform sampler2D uRock;
  uniform float uTexScale;      // unités monde par tuile
  uniform float uRockSlope;     // seuil de pente pour la roche
  uniform float uHighAltitude;  // altitude où la roche/sécheresse domine
  uniform float uPatchScale;    // échelle des plaques

  varying vec3 vWorldPos;
  varying float vHeight;
  varying float vSlope;

  ${TERRAIN_SHADER_LIB}

  void main() {
    vec2 uv = vWorldPos.xz / uTexScale;

    vec3 dirt = textureNoTile(uDirt, uv);
    vec3 darkEarth = textureNoTile(uDarkEarth, uv);
    vec3 grass = textureNoTile(uGrass, uv);
    vec3 dryGrass = textureNoTile(uDryGrass, uv);
    vec3 rock = textureNoTile(uRock, uv);

    // Plaques basse fréquence : où l'herbe vs l'herbe sèche vs la terre nue
    // domine — la TERRE reste dominante (biais dans les seuils). NB : patch
    // est un mot réservé GLSL (tessellation) donc on nomme patchA/patchB.
    float patchA = vnoise(vWorldPos.xz / uPatchScale);
    float patchB = vnoise(vWorldPos.xz / (uPatchScale * 0.37) + 13.0);

    // Base = terre, assombrie dans les creux/plaques sombres.
    vec3 col = mix(dirt, darkEarth, smoothstep(0.55, 0.85, patchB));

    // Un peu de verdure : petites plaques d'herbe là où patchA est haut (rare).
    float grassMask = smoothstep(0.62, 0.82, patchA) * 0.65;
    col = mix(col, grass, grassMask);

    // Un peu de verdure sèche : plaques kaki intermédiaires.
    float dryMask = smoothstep(0.45, 0.6, patchA) * (1.0 - grassMask) * 0.5;
    col = mix(col, dryGrass, dryMask);

    // ROCHE sur les pentes raides : vSlope bas = paroi.
    float rockSlope = 1.0 - smoothstep(uRockSlope, uRockSlope + 0.15, vSlope);
    // ROCHE / terre sèche en altitude (crêtes, méga-dunes).
    float rockAlt = smoothstep(uHighAltitude, uHighAltitude * 2.0, vHeight);
    float rockMask = clamp(rockSlope + rockAlt * 0.5, 0.0, 1.0);
    col = mix(col, rock, rockMask);

    csm_DiffuseColor = vec4(col, 1.0);
    // Rugosité élevée (sol mat) ; la roche un peu moins pour un léger éclat.
    csm_Roughness = mix(1.0, 0.82, rockMask * 0.5);
  }
`
