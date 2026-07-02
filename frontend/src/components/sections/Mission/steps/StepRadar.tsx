import { RadarSelector } from '../RadarSelector'
import { RadarPreviewPanel } from '../RadarPreviewPanel'
import type { RadarConfig, RadarTemplate } from '@/types/radar.types'

interface StepRadarProps {
  radarConfig: RadarConfig | null
  onSelect: (template: RadarTemplate) => void
}

export function StepRadar({ radarConfig, onSelect }: StepRadarProps) {
  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-6 lg:flex-row">
      <div className="w-full shrink-0 lg:w-72">
        <p className="mb-4 text-sm font-medium text-ink-dim">Choisissez le radar à évaluer</p>
        <RadarSelector selectedTemplateId={radarConfig?.templateId ?? null} onSelect={onSelect} />
      </div>

      <div className="min-h-[42vh] flex-1 overflow-hidden rounded-3xl bg-surface/40">
        <RadarPreviewPanel config={radarConfig} />
      </div>
    </div>
  )
}
