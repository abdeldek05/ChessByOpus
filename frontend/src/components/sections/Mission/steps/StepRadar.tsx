import { useState } from 'react'
import { RadarSelector } from '../RadarSelector'
import { RadarSettings } from '../RadarSettings'
import { RadarPreviewPanel } from '../RadarPreviewPanel'
import type { RadarConfig, RadarTemplate } from '@/types/radar.types'
import type { PlacedRadar } from '@/types/mission.types'

interface StepRadarProps {
  radars: PlacedRadar[]
  canAddRadar: boolean
  onAddRadar: () => void
  onRemoveRadar: (id: string) => void
  onSelectTemplate: (id: string, template: RadarTemplate) => void
  onUpdateConfig: (id: string, patch: Partial<RadarConfig>) => void
  detectionThresholdSec: number
  onThresholdChange: (seconds: number) => void
}

/**
 * Étape radar multi : on compose 1 à 2 radars. Des onglets (Radar 1 / Radar 2 /
 * + Ajouter) sélectionnent celui qu'on édite ; en dessous, on choisit son
 * modèle et ses réglages. Le seuil de préavis (au niveau du scénario) est réglé
 * une seule fois. La vitrine 3D montre le radar actif.
 */
export function StepRadar({
  radars,
  canAddRadar,
  onAddRadar,
  onRemoveRadar,
  onSelectTemplate,
  onUpdateConfig,
  detectionThresholdSec,
  onThresholdChange,
}: StepRadarProps) {
  const [activeId, setActiveId] = useState(radars[0]?.id ?? '')
  const active = radars.find((r) => r.id === activeId) ?? radars[0]
  const multiple = radars.length > 1

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-6 lg:flex-row">
      <div className="w-full shrink-0 space-y-5 lg:w-80">
        {/* Onglets radars */}
        <div className="flex flex-wrap items-center gap-2">
          {radars.map((radar, index) => {
            const isActive = radar.id === active?.id
            return (
              <button
                key={radar.id}
                type="button"
                onClick={() => setActiveId(radar.id)}
                className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
                  isActive ? 'bg-accent text-bg' : 'bg-surface text-ink-dim hover:bg-surface-2'
                }`}
              >
                Radar {index + 1}
                {multiple && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`Retirer le radar ${index + 1}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      onRemoveRadar(radar.id)
                      if (radar.id === active?.id) setActiveId(radars.find((r) => r.id !== radar.id)!.id)
                    }}
                    className={`-mr-1 flex size-4 items-center justify-center rounded-full text-[11px] ${
                      isActive ? 'hover:bg-black/20' : 'hover:bg-surface'
                    }`}
                  >
                    ×
                  </span>
                )}
              </button>
            )
          })}
          {canAddRadar && (
            <button
              type="button"
              onClick={onAddRadar}
              className="rounded-full bg-surface px-3.5 py-2 text-xs font-medium text-accent-bright transition-colors hover:bg-surface-2"
            >
              + Ajouter
            </button>
          )}
        </div>

        {active && (
          <>
            <div>
              <p className="mb-4 text-sm font-medium text-ink-dim">Modèle du radar {radars.indexOf(active) + 1}</p>
              <RadarSelector
                selectedTemplateId={active.config.templateId}
                onSelect={(template) => onSelectTemplate(active.id, template)}
              />
            </div>

            <RadarSettings
              config={active.config}
              onChange={(patch) => onUpdateConfig(active.id, patch)}
              detectionThresholdSec={detectionThresholdSec}
              onThresholdChange={onThresholdChange}
            />
          </>
        )}
      </div>

      <div className="min-h-[42vh] flex-1 overflow-hidden rounded-3xl bg-surface/40 lg:sticky lg:top-0">
        <RadarPreviewPanel config={active?.config ?? null} />
      </div>
    </div>
  )
}
