import { Header } from '@/components/layout/Header'
import { InteractiveCta } from '@/components/ui/InteractiveCta'

export function NotFound() {
  return (
    <>
      <Header />
      <section className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
        <p className="font-mono text-xs tracking-[0.2em] text-ink-dim uppercase">Error 404</p>
        <h1 className="mt-4 text-4xl font-bold text-ink lg:text-5xl">This page does not exist.</h1>
        <p className="mt-5 max-w-md text-ink-dim">
          The link you followed is broken or the page is not yet
          online.
        </p>
        <div className="mt-10">
          <InteractiveCta href="/">← Back to home</InteractiveCta>
        </div>
      </section>
    </>
  )
}
