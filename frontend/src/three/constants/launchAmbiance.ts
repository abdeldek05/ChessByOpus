// Deux ambiances de scène commutables au doigt (soleil/lune), sans calcul de
// position solaire. Couleurs THREE (rendu 3D), désaturées pour rester dans la
// patte du site. La nuit n'est pas totalement noire : on garde de la lecture.
export interface LaunchAmbiance {
  skyTop: string
  skyHorizon: string
  fog: string
  ground: string
  keyColor: string
  keyIntensity: number
  hemiSky: string
  hemiGround: string
  hemiIntensity: number
  ambientColor: string
  ambientIntensity: number
}

export const DAY_AMBIANCE: LaunchAmbiance = {
  skyTop: '#3f6ea5',
  skyHorizon: '#9fb8cc',
  fog: '#9fb8cc',
  ground: '#4a5340',
  keyColor: '#fff2dc',
  keyIntensity: 2.6,
  hemiSky: '#8fb4d8',
  hemiGround: '#3a3f30',
  hemiIntensity: 0.8,
  ambientColor: '#b9c4d0',
  ambientIntensity: 0.3,
}

export const NIGHT_AMBIANCE: LaunchAmbiance = {
  skyTop: '#1a2740',
  skyHorizon: '#42536b',
  fog: '#42536b',
  ground: '#39423b',
  keyColor: '#b8c8e6',
  keyIntensity: 1.7,
  hemiSky: '#4a5c7a',
  hemiGround: '#2a3026',
  hemiIntensity: 0.7,
  ambientColor: '#5a6880',
  ambientIntensity: 0.45,
}
