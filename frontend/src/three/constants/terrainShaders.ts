// GLSL du splatting de terrain PRAIRIE, injecté dans un MeshStandardMaterial
// via three-custom-shader-material (CSM) : on écrit csm_DiffuseColor,
// csm_Roughness et csm_FragNormal — fog, ombres et éclairage PBR du matériau
// standard restent actifs. GAZON dominant (pack LAWN), plaques sèches
// discrètes, terre nue rare, roche réservée aux pentes raides. Anti-tiling
// « textureNoTile » (helpers partagés dans terrainShaderLib). Le fragment du
// biome désert vit dans terrainShadersDesert.ts.
import { TERRAIN_SHADER_LIB } from '@/three/constants/terrainShaderLib'
import { TERRAIN_ROUGHNESS } from '@/three/constants/terrainNormalMaps'

// Réglages du splatting prairie (valeurs des uniforms). En UNITÉS SCÈNE (1 u = 8 m).
export const SPLAT_CONFIG_MEADOW = {
  /** Unités monde par tuile de texture — le pack LAWN est conçu pour ~5 u/tuile. */
  texScale: 6,
  /** Seuil de pente (normale.y) sous lequel la roche apparaît (0.55 ≈ >56°). */
  rockSlope: 0.55,
  /** Altitude (unités) où les crêtes passent à l'herbe séchée. */
  highAltitude: 26,
  /** Échelle des plaques de dominante (zones sèches/terre). */
  patchScale: 90,
} as const

// Le vertex shader expose au fragment : position monde (tiling à l'échelle
// réelle), hauteur (altitude), normale monde (TBN du micro-relief) et pente.
export const TERRAIN_VERTEX = /* glsl */ `
  varying vec3 vWorldPos;
  varying float vHeight;
  varying float vSlope;
  varying vec3 vWorldNormal;

  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vHeight = wp.y;
    // normal est en repère objet ; le terrain n'est pas incliné (juste tourné
    // -90° sur X à la construction, déjà cuit dans la géométrie) → la normale
    // monde a sa verticale sur Y. 1 = plat, 0 = paroi verticale.
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vSlope = vWorldNormal.y;
  }
`

// GLSL attend des littéraux flottants : 1 → "1.00".
const glf = (n: number) => n.toFixed(2)

// Fragment prairie : gazon dominant + micro-relief par normal maps.
export const TERRAIN_FRAGMENT_MEADOW = /* glsl */ `
  uniform sampler2D uGrass;
  uniform sampler2D uDryGrass;
  uniform sampler2D uDirt;
  uniform sampler2D uRock;
  uniform sampler2D uGrassNormal;
  uniform sampler2D uDirtNormal;
  uniform sampler2D uRockNormal;
  uniform float uTexScale;      // unités monde par tuile
  uniform float uRockSlope;     // seuil de pente pour la roche
  uniform float uHighAltitude;  // altitude où les crêtes sèchent
  uniform float uPatchScale;    // échelle des plaques de dominante
  uniform float uNormalScale;   // intensité globale du micro-relief (0 = off)

  varying vec3 vWorldPos;
  varying float vHeight;
  varying float vSlope;
  varying vec3 vWorldNormal;

  ${TERRAIN_SHADER_LIB}

  void main() {
    vec2 uv = vWorldPos.xz / uTexScale;

    vec3 grass = textureNoTile(uGrass, uv);
    vec3 dryGrass = textureNoTile(uDryGrass, uv);
    vec3 dirt = textureNoTile(uDirt, uv);
    vec3 rock = textureNoTile(uRock, uv);

    // Plaques basse fréquence de dominante. NB : patch est un mot réservé
    // GLSL (tessellation) donc patchA/patchB.
    float patchA = vnoise(vWorldPos.xz / uPatchScale);
    float patchB = vnoise(vWorldPos.xz / (uPatchScale * 0.37) + 13.0);

    // Base = GAZON riche (pack LAWN : verts variés, plages jaunies intégrées).
    vec3 col = grass;

    // Plaques d'herbe sèche/paille DISCRÈTES.
    float dryMask = smoothstep(0.60, 0.78, patchA) * 0.55;
    col = mix(col, dryGrass, dryMask);

    // Terre nue RARE : petites clairières là où patchB est très haut.
    float dirtMask = smoothstep(0.74, 0.88, patchB) * 0.6;
    col = mix(col, dirt, dirtMask);

    // Crêtes/altitude : l'herbe sèche (exposée au vent), pas de roche ici.
    float altDry = smoothstep(uHighAltitude, uHighAltitude * 2.0, vHeight) * 0.5;
    col = mix(col, dryGrass, altDry);

    // ROCHE réservée aux pentes raides (vSlope bas = paroi).
    float rockMask = 1.0 - smoothstep(uRockSlope, uRockSlope + 0.15, vSlope);
    col = mix(col, rock, rockMask);

    csm_DiffuseColor = vec4(col, 1.0);

    // --- Micro-relief : normal maps par surface, mixées par les mêmes masques.
    // Taps SIMPLES (pas textureNoTile : ses flips de signe UV par cellule
    // inverseraient les composantes tangentes → relief faux par plaques).
    vec3 tn = texture2D(uGrassNormal, uv).xyz * 2.0 - 1.0;
    tn = mix(tn, texture2D(uDirtNormal, uv).xyz * 2.0 - 1.0, dirtMask);
    tn = mix(tn, texture2D(uRockNormal, uv * 0.5).xyz * 2.0 - 1.0, rockMask);
    tn.xy *= uNormalScale;

    // TBN monde « up-aligné » : les UV étant worldPos.xz, la tangente monde est
    // connue analytiquement (axe X), orthogonalisée contre la vraie normale
    // géométrique (Gram-Schmidt) pour rester correcte en pente.
    vec3 N = normalize(vWorldNormal);
    vec3 T = normalize(vec3(1.0, 0.0, 0.0) - N * N.x);
    vec3 B = cross(N, T);
    vec3 wn = normalize(T * tn.x + B * tn.y + N * tn.z);
    // csm_FragNormal attend une normale en espace VUE.
    csm_FragNormal = normalize(mat3(viewMatrix) * wn);

    // Rugosité PBR par surface (mêmes masques que l'albédo).
    float rough = ${glf(TERRAIN_ROUGHNESS.grass)};
    rough = mix(rough, ${glf(TERRAIN_ROUGHNESS.dry)}, max(dryMask, altDry));
    rough = mix(rough, ${glf(TERRAIN_ROUGHNESS.dirt)}, dirtMask);
    rough = mix(rough, ${glf(TERRAIN_ROUGHNESS.rock)}, rockMask);
    csm_Roughness = rough;
  }
`
