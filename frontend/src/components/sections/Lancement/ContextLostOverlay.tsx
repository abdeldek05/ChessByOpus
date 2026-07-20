/**
 * Overlay affiché le temps qu'un contexte WebGL perdu soit restauré (ou le canvas
 * remonté). Remplace l'écran blanc muet par un signal clair et sobre, dans le
 * langage HUD laiton du reste de l'app.
 */
export function ContextLostOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-bg/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 animate-ping rounded-full bg-accent-bright" />
        <span className="font-fine text-[11px] font-light tracking-[0.3em] text-accent-bright uppercase">
          Reconnexion GPU…
        </span>
      </div>
    </div>
  )
}
