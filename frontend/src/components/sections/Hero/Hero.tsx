import { MesangeCanvas } from '@/three/canvas/MesangeCanvas'
import { InteractiveCta } from '@/components/ui/InteractiveCta'

export function Hero() {
  return (
    <section className="relative flex min-h-screen items-center bg-bg pt-32 pb-16">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="font-mono text-xs tracking-[0.2em] text-ink-dim uppercase">
            Opus Aerospace · Aerial Threat Simulation
          </p>
          <h1 className="mt-4 text-5xl leading-[1.05] font-bold text-ink lg:text-6xl">
            We anticipate every move before it happens.
          </h1>
          <p className="mt-6 max-w-md text-ink-dim">
            CHESS simulates, scenarizes and validates realistic aerial threats
            around the Mesange rocket.
          </p>

          <div className="mt-8">
            <InteractiveCta href="/simulation">Launch</InteractiveCta>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="mx-auto aspect-[4/5] w-full max-w-[520px] border border-border">
            <MesangeCanvas className="size-full" />
          </div>
        </div>
      </div>
    </section>
  )
}
