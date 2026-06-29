import { CopyEmailButton } from '@/components/ui/CopyEmailButton'
import { InteractiveCta } from '@/components/ui/InteractiveCta'
import { CONTACT_EMAIL } from './contactInfo'

export function ContactSection() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 pt-32 pb-16 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-ink-dim uppercase">Contact</p>
      <h1 className="mt-4 max-w-xl text-4xl leading-[1.1] font-bold text-ink lg:text-5xl">
        Parlons de votre prochaine simulation.
      </h1>
      <p className="mt-5 max-w-md text-ink-dim">
        Une question, une démonstration à organiser, un cas d'usage à étudier —
        écrivez-nous.
      </p>

      <div className="mt-10 flex items-center gap-4">
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-xl text-ink underline-offset-4 transition-colors duration-300 ease-out hover:text-accent hover:underline lg:text-2xl"
        >
          {CONTACT_EMAIL}
        </a>
        <CopyEmailButton email={CONTACT_EMAIL} />
      </div>

      <p className="mt-3 font-mono text-[11px] tracking-[0.15em] text-ink-faint uppercase">
        Réponse sous 48h ouvrées
      </p>

      <div className="mt-12">
        <InteractiveCta href="/">← Retour à l'accueil</InteractiveCta>
      </div>
    </section>
  )
}
