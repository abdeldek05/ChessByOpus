import { radarTemplates } from '@/data/radarTemplates'
import type { RadarTemplate } from '@/types/radar.types'

interface RadarSelectorProps {
  selectedTemplateId: string | null
  onSelect: (template: RadarTemplate) => void
}

export function RadarSelector({ selectedTemplateId, onSelect }: RadarSelectorProps) {
  return (
    <div className="space-y-3">
      {radarTemplates.map((template) => {
        const isSelected = template.id === selectedTemplateId
        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template)}
            className={`w-full rounded-2xl p-4 text-left transition-all duration-200 ${
              isSelected
                ? 'bg-accent/15 shadow-lg shadow-black/20'
                : 'bg-surface hover:-translate-y-0.5 hover:bg-surface-2'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={`text-base font-semibold ${isSelected ? 'text-accent-bright' : 'text-ink'}`}>
                  {template.name}
                </p>
                <p className="mt-0.5 text-xs text-ink-dim">{template.manufacturer}</p>
              </div>
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] transition-colors ${
                  isSelected ? 'bg-accent text-bg' : 'bg-surface-2 text-transparent'
                }`}
              >
                ✓
              </span>
            </div>

            <div className="mt-3 flex gap-5 text-xs text-ink-dim">
              <span>
                Portée <span className="font-semibold text-ink">{template.rangeKm} km</span>
              </span>
              <span>
                Plafond <span className="font-semibold text-ink">{template.ceilingM} m</span>
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
