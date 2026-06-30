import { Link } from 'react-router-dom'
import { launchSites } from '@/data/launchSites'

export function HudOverlay() {
  const activeSiteCount = String(launchSites.length).padStart(2, '0')

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Vignette d'ambiance */}
      <div className="hud-vignette absolute inset-0" />

      {/* Coins du cadre */}
      <span className="absolute top-4 left-4 size-6 border-t border-l border-accent/60" />
      <span className="absolute top-4 right-4 size-6 border-t border-r border-accent/60" />
      <span className="absolute bottom-4 left-4 size-6 border-b border-l border-accent/60" />
      <span className="absolute right-4 bottom-4 size-6 border-r border-b border-accent/60" />

      {/* Passerelle vers l'accueil (Mésange en 3D) */}
      <Link
        to="/"
        className="pointer-events-auto absolute top-7 left-10 font-mono text-[11px] tracking-[0.18em] text-ink-dim uppercase transition-colors hover:text-accent"
      >
        ← Voir Mésange
      </Link>

      {/* Ligne de scan */}
      <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
        <div className="h-px w-full bg-accent/30 animate-[hud-scan_7s_linear_infinite]" />
      </div>

      {/* Légende inférieure droite */}
      <div className="absolute right-10 bottom-9 text-right font-mono text-[10px] leading-relaxed tracking-[0.18em] text-ink-faint uppercase">
        <p>Sites de lancement — {activeSiteCount} actifs</p>
        <p>Sélectionnez un site sur la carte</p>
      </div>
    </div>
  )
}
