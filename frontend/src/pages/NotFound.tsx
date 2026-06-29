import { Header } from '@/components/layout/Header'
import { InteractiveCta } from '@/components/ui/InteractiveCta'

export function NotFound() {
  return (
    <>
      <Header />
      <section className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
        <p className="font-mono text-xs tracking-[0.2em] text-ink-dim uppercase">Erreur 404</p>
        <h1 className="mt-4 text-4xl font-bold text-ink lg:text-5xl">Cette page n'existe pas.</h1>
        <p className="mt-5 max-w-md text-ink-dim">
          Le lien que vous avez suivi est rompu ou la page n'est pas encore en
          ligne.
        </p>
        <div className="mt-10">
          <InteractiveCta href="/">← Retour à l'accueil</InteractiveCta>
        </div>
      </section>
    </>
  )
}
