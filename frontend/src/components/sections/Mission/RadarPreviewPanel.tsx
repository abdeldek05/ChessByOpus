import { RadarPreviewCanvas } from '@/three/canvas/RadarPreviewCanvas'
import { RadarSpecCallouts } from './RadarSpecCallouts'
import type { RadarConfig } from '@/types/radar.types'

interface RadarPreviewPanelProps {
  config: RadarConfig | null
}

export function RadarPreviewPanel({ config }: RadarPreviewPanelProps) {
  if (!config) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="font-mono text-xs tracking-[0.15em] text-ink-faint uppercase">
          Sélectionnez un radar
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      {/* Pas de `key` sur le Canvas : le remonter à chaque changement de radar
          recréait un contexte WebGL à chaque fois → saturation (context lost,
          écran noir) après quelques sélections. On garde UN seul canvas monté ;
          seul le modelPath change à l'intérieur (le GLB se recharge sans
          recréer le contexte). */}
      <RadarPreviewCanvas
        modelPath={config.modelPath}
        tintColor={config.tintColor}
        className="h-full w-full"
      />
      <RadarSpecCallouts config={config} />
    </div>
  )
}
