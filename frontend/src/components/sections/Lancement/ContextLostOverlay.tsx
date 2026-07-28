/**
 * Overlay affiché le temps qu'un contexte WebGL perdu soit restauré (ou le canvas
 * remonté). Remplace l'écran blanc muet par un signal clair et sobre, dans le
 * langage HUD laiton du reste de l'app.
 */
export function ContextLostOverlay() {
  return (
    <div className="hud-veil pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 animate-ping rounded-full bg-accent-bright" />
        <span className="type-eyebrow font-fine font-light text-accent-bright">
          Reconnexion GPU…
        </span>
      </div>
    </div>
  )
}
