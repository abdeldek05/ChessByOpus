import { useHudClock } from "@/hooks/useHudClock";

export function HudOverlay() {
  const time = useHudClock();

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Vignette d'ambiance */}
      <div className="hud-vignette absolute inset-0" />

      {/* Coins du cadre */}
      <span className="absolute top-4 left-4 size-6 border-t border-l border-accent/60" />
      <span className="absolute top-4 right-4 size-6 border-t border-r border-accent/60" />
      <span className="absolute bottom-4 left-4 size-6 border-b border-l border-accent/60" />
      <span className="absolute right-4 bottom-4 size-6 border-r border-b border-accent/60" />

      {/* Barre d'état supérieure */}
      <div className="absolute inset-x-10 top-7 flex items-center justify-between font-mono text-[11px] tracking-[0.18em] text-ink-dim uppercase">
        <span className="text-accent">CHESS // Théâtre de simulation</span>
        <span className="flex items-center gap-4">
          <span>{time} UTC</span>
          <span className="flex items-center gap-1.5 text-ink">
            <span className="size-1.5 rounded-full bg-accent animate-[hud-blink_1.6s_ease-in-out_infinite]" />
            LIVE
          </span>
        </span>
      </div>

      {/* Ligne de scan */}
      <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
        <div className="h-px w-full bg-accent/30 animate-[hud-scan_7s_linear_infinite]" />
      </div>

      {/* Légende inférieure droite */}
      <div className="absolute right-10 bottom-9 text-right font-mono text-[10px] leading-relaxed tracking-[0.18em] text-ink-faint uppercase">
        <p>Théâtre — Europe occidentale</p>
        <p>Sites de lancement — 02 actifs</p>
        <p>Sélectionnez un site sur la carte</p>
      </div>
    </div>
  );
}
