import { LoginPanel } from './LoginPanel'
import { LoginForm } from './LoginForm'
import { BackHomeLink } from './BackHomeLink'

/**
 * Écran de connexion. Orchestre uniquement : la plaque biseautée, le formulaire
 * et le retour à l'accueil. Même grammaire que Hero/ContactSection (eyebrow
 * mono, titre lourd, sous-titre atténué) pour rester dans la DA de l'app.
 */
export function LoginSection() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-bg px-6 pt-32 pb-16">
      <div className="w-full max-w-md">
        <p className="type-label font-mono text-ink-dim">Restricted access</p>
        <h1 className="mt-4 text-4xl leading-[1.05] font-bold text-ink">
          Authentication required.
        </h1>
        <p className="mt-4 text-body text-ink-dim">
          Mission simulation is reserved for authorized operators.
        </p>

        <LoginPanel>
          <LoginForm />
        </LoginPanel>

        <div className="mt-8">
          <BackHomeLink />
        </div>
      </div>
    </section>
  )
}
