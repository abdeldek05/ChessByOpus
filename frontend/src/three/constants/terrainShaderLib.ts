// Helpers GLSL PARTAGÉS entre les fragments de splatting des deux biomes
// (prairie dans terrainShaders.ts, désert dans terrainShadersDesert.ts) :
// anti-tiling « textureNoTile » d'Inigo Quilez + bruit de valeur des plaques.
// Préfixé tel quel en tête de chaque fragment shader.

export const TERRAIN_SHADER_LIB = /* glsl */ `
  // Hash + textureNoTile (Inigo Quilez, https://www.shadertoy.com/view/Xtl3zf) :
  // échantillonne la texture avec un décalage pseudo-aléatoire par cellule pour
  // supprimer le motif de répétition visible sur les grandes surfaces.
  vec4 hash4(vec2 p) {
    return fract(sin(vec4(
      1.0 + dot(p, vec2(37.0, 17.0)),
      2.0 + dot(p, vec2(11.0, 47.0)),
      3.0 + dot(p, vec2(41.0, 29.0)),
      4.0 + dot(p, vec2(23.0, 31.0)))) * 103.0);
  }

  vec3 textureNoTile(sampler2D samp, vec2 uv) {
    vec2 iuv = floor(uv);
    vec2 fuv = fract(uv);
    vec4 ofa = hash4(iuv + vec2(0.0, 0.0));
    vec4 ofb = hash4(iuv + vec2(1.0, 0.0));
    vec4 ofc = hash4(iuv + vec2(0.0, 1.0));
    vec4 ofd = hash4(iuv + vec2(1.0, 1.0));
    vec2 ddx = dFdx(uv);
    vec2 ddy = dFdy(uv);
    ofa.zw = sign(ofa.zw - 0.5);
    ofb.zw = sign(ofb.zw - 0.5);
    ofc.zw = sign(ofc.zw - 0.5);
    ofd.zw = sign(ofd.zw - 0.5);
    vec2 uva = uv * ofa.zw + ofa.xy; vec2 ddxa = ddx * ofa.zw; vec2 ddya = ddy * ofa.zw;
    vec2 uvb = uv * ofb.zw + ofb.xy; vec2 ddxb = ddx * ofb.zw; vec2 ddyb = ddy * ofb.zw;
    vec2 uvc = uv * ofc.zw + ofc.xy; vec2 ddxc = ddx * ofc.zw; vec2 ddyc = ddy * ofc.zw;
    vec2 uvd = uv * ofd.zw + ofd.xy; vec2 ddxd = ddx * ofd.zw; vec2 ddyd = ddy * ofd.zw;
    vec2 b = smoothstep(0.25, 0.75, fuv);
    return mix(
      mix(textureGrad(samp, uva, ddxa, ddya).xyz, textureGrad(samp, uvb, ddxb, ddyb).xyz, b.x),
      mix(textureGrad(samp, uvc, ddxc, ddyc).xyz, textureGrad(samp, uvd, ddxd, ddyd).xyz, b.x),
      b.y);
  }

  // Bruit de valeur léger pour piloter les plaques de dominante (variation
  // horizontale basse fréquence) — indépendant de la répétition de texture.
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
    float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
    float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
`
