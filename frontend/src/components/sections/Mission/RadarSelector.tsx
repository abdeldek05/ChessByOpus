import { radarTemplates } from '@/data/radarTemplates'
import type { RadarTemplate } from '@/types/radar.types'

interface RadarSelectorProps {
  selectedTemplateId: string | null
  onSelect: (template: RadarTemplate) => void
}

export function RadarSelector({ selectedTemplateId, onSelect }: RadarSelectorProps) {
  return (
    <div>
      <p className="text-[11px] tracking-[0.2em] text-ink-dim uppercase">Radar de détection</p>
      <div className="mt-3 space-y-3">
        {radarTemplates.map((template) => {
          const isSelected = template.id === selectedTemplateId
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template)}
              className={`w-full border-l-2 py-1.5 pl-4 text-left transition-colors duration-200 ease-out ${
                isSelected ? 'border-accent' : 'border-border hover:border-accent/60'
              }`}
            >
              <p className="font-mono text-sm text-ink">{template.name}</p>
              <p className="text-xs text-ink-dim">{template.manufacturer} · portée {template.rangeKm} km</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
