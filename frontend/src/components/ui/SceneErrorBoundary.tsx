import { Component, type ErrorInfo, type ReactNode } from 'react'

interface SceneErrorBoundaryProps {
  children: ReactNode
  /** Libellé du contexte en échec, affiché dans le panneau de secours. */
  label?: string
}

interface SceneErrorBoundaryState {
  error: Error | null
  /** Incrémenté à chaque « Réessayer » : force le remontage complet des enfants. */
  resetKey: number
}

/**
 * Filet de sécurité de rendu : capture toute exception levée pendant le render
 * d'un sous-arbre (scène 3D, carte, HUD) et affiche un panneau de secours plat
 * — plutôt que de laisser React démonter tout l'arbre et blanchir l'app. « Réessayer »
 * remonte les enfants (utile pour une erreur transitoire, ex. perte de contexte
 * GPU pendant un render) ; « Recharger » repart d'une page neuve en dernier recours.
 */
export class SceneErrorBoundary extends Component<
  SceneErrorBoundaryProps,
  SceneErrorBoundaryState
> {
  state: SceneErrorBoundaryState = { error: null, resetKey: 0 }

  static getDerivedStateFromError(error: Error): Partial<SceneErrorBoundaryState> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Trace conservée en console pour le diagnostic — l'utilisateur, lui, voit
    // le panneau de secours et non plus un écran blanc muet.
    console.error('[SceneErrorBoundary] rendu interrompu :', error, info.componentStack)
  }

  private handleRetry = () => {
    this.setState((s) => ({ error: null, resetKey: s.resetKey + 1 }))
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.error) {
      // `resetKey` en clé : « Réessayer » recrée entièrement le sous-arbre.
      return <div key={this.state.resetKey} className="contents">{this.props.children}</div>
    }

    return (
      <div className="hud-vignette fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="font-fine text-[11px] font-light tracking-[0.3em] text-alert uppercase">
            {this.props.label ?? 'Scène interrompue'}
          </span>
          <p className="max-w-sm text-sm text-ink-dim">
            Un rendu a échoué. La scène a été mise en pause pour éviter un écran blanc.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={this.handleRetry}
            className="font-mono text-xs tracking-[0.2em] text-accent-bright uppercase transition-colors hover:text-ink"
          >
            Réessayer
          </button>
          <span className="h-3 w-px bg-border" />
          <button
            type="button"
            onClick={this.handleReload}
            className="font-mono text-xs tracking-[0.2em] text-ink-dim uppercase transition-colors hover:text-ink"
          >
            Recharger
          </button>
        </div>
      </div>
    )
  }
}
