import { useState } from 'react'
import { HudRange } from './HudRange'
import { HudToggle } from './HudToggle'
import { COVERAGE_ELEVATION_MAX_DEG } from '@/constants/coverage'
import type { RadarConfig } from '@/types/radar.types'

interface RadarSettingsProps {
  config: RadarConfig
  onChange: (patch: Partial<RadarConfig>) => void
}

/**
 * Réglages du radar sélectionné : portée, plafond, rotatif, paramètre avancé
 * (SER), et seuil de préavis de détection — tous propres à CE radar.
 */
export function RadarSettings({ config, onChange }: RadarSettingsProps) {
  const [showRcs, setShowRcs] = useState(false)

  return (
    <div className="space-y-4">
      <div className="space-y-6 rounded-3xl bg-surface p-6">
        <p className="text-sm font-medium text-ink-dim">Settings — {config.name}</p>

        {/* Bornes calibrées pour les radars longue portée (GM400 : 470 km). */}
        <HudRange label="Range" value={config.rangeKm} min={5} max={600} step={5} unit="km" onChange={(v) => onChange({ rangeKm: v })} />
        <HudRange label="Ceiling" value={config.ceilingM} min={1000} max={40000} step={500} unit="m" onChange={(v) => onChange({ ceilingM: v })} />
        <HudToggle label="Rotating" checked={config.rotating} onChange={(v) => onChange({ rotating: v })} />
        {config.rotating && (
          <HudRange
            label="Scan speed"
            value={config.rotationRpm}
            min={10}
            max={90}
            step={5}
            unit="rpm"
            onChange={(v) => onChange({ rotationRpm: v })}
          />
        )}

        {/* Site max du faisceau : au-dessus, cône de silence. 90° = pas de zone
            aveugle (GF300) ; 40° = gros trou au zénith (GM400). Envoyé au moteur
            via maxElevationDeg (buildSimulatePayload). */}
        <HudRange
          label="Max elevation"
          value={config.elevationMaxDeg ?? COVERAGE_ELEVATION_MAX_DEG}
          min={20}
          max={90}
          step={5}
          unit="°"
          onChange={(v) => onChange({ elevationMaxDeg: v })}
        />

        {showRcs && (
          <>
            <HudRange
              label="Min. detectable RCS"
              value={config.minDetectableRcsM2}
              min={0.1}
              max={10}
              step={0.1}
              unit="m²"
              onChange={(v) => onChange({ minDetectableRcsM2: v })}
            />
            <HudRange
              label="Antenna height"
              value={config.antennaHeightM}
              min={2}
              max={15}
              step={0.5}
              unit="m"
              onChange={(v) => onChange({ antennaHeightM: v })}
            />
          </>
        )}

        <button
          type="button"
          onClick={() => setShowRcs((current) => !current)}
          className="type-label text-ink-faint transition-colors hover:text-accent-bright"
        >
          {showRcs ? '— Hide advanced parameter' : '+ Advanced parameter'}
        </button>
      </div>

      {/* Critère de réussite du client : préavis de détection minimum exigé. */}
      <div className="space-y-3 rounded-3xl bg-surface p-6">
        <HudRange
          label="Lead-time threshold (detection)"
          value={config.detectionThresholdSec}
          min={5}
          max={120}
          step={1}
          unit="s"
          onChange={(v) => onChange({ detectionThresholdSec: v })}
        />
        <p className="text-label leading-relaxed text-ink-faint">
          Minimum lead time required between this radar acquiring the threat and impact. Below it, the
          detection is deemed too late.
        </p>
      </div>
    </div>
  )
}
