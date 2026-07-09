import { useEffect, useRef, useState } from 'react'
import { RadarSelector } from '../RadarSelector'
import { RadarPreviewPanel } from '../RadarPreviewPanel'
import type { RadarTemplate } from '@/types/radar.types'
import type { PlacedRadar } from '@/types/mission.types'

interface StepRadarProps {
  radars: PlacedRadar[]
  canAddRadar: boolean
  onAddRadar: () => void
  onRemoveRadar: (id: string) => void
  onSelectTemplate: (id: string, template: RadarTemplate) => void
}

/**
 * Étape 1 : composer le parc radar (1 ou 2). Des onglets (Radar 1 / Radar 2 /
 * + Ajouter) sélectionnent celui qu'on édite ; en dessous, on choisit son
 * modèle (Giraffe / GM60). La vitrine 3D montre le radar actif. Les réglages
 * (portée, plafond…) se font à l'étape suivante.
 */
export function StepRadar({
  radars,
  canAddRadar,
  onAddRadar,
  onRemoveRadar,
  onSelectTemplate,
}: StepRadarProps) {
  const [activeId, setActiveId] = useState(radars[0]?.id ?? '')
  const active = radars.find((r) => r.id === activeId) ?? radars[0]
  const multiple = radars.length > 1

  // Bascule automatiquement sur le radar qu'on vient d'ajouter : sinon
  // "Ajouter un radar" ne change rien à l'écran (on reste sur Radar 1), et
  // aller voir l'onglet Radar 2 ensuite donne l'impression d'un doublon —
  // même modèle par défaut, même sélection — plutôt que d'un radar distinct
  // qu'on doit encore configurer.
  const previousCountRef = useRef(radars.length)
  useEffect(() => {
    if (radars.length > previousCountRef.current) {
      setActiveId(radars[radars.length - 1].id)
    }
    previousCountRef.current = radars.length
  }, [radars])

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-6 lg:flex-row">
      <div className="w-full shrink-0 space-y-5 lg:w-80">
        {active && (
          <div>
            <p className="mb-4 text-sm font-medium text-ink-dim">Modèle du radar {radars.indexOf(active) + 1}</p>
            <RadarSelector
              selectedTemplateId={active.config.templateId}
              onSelect={(template) => onSelectTemplate(active.id, template)}
            />
            {canAddRadar && (
              <button
                type="button"
                onClick={onAddRadar}
                className="mt-3 w-full rounded-2xl bg-surface px-4 py-3.5 text-left text-sm font-medium text-accent-bright transition-colors hover:bg-surface-2"
              >
                + Ajouter un radar
              </button>
            )}
          </div>
        )}

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
        </div>
      </div>

      <div className="min-h-[42vh] flex-1 overflow-hidden rounded-3xl bg-surface/40 lg:sticky lg:top-0">
        <RadarPreviewPanel config={active?.config ?? null} />
      </div>
    </div>
  )
}
