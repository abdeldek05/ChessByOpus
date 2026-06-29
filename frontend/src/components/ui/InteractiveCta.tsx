import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useMagneticHover } from '@/hooks/useMagneticHover'

interface InteractiveCtaProps {
  href: string
  children: ReactNode
}

export function InteractiveCta({ href, children }: InteractiveCtaProps) {
  const magneticRef = useMagneticHover<HTMLAnchorElement>()

  return (
    <Link
      ref={magneticRef}
      to={href}
      className="group relative inline-flex items-center gap-2 border border-border px-6 py-3 font-mono text-xs tracking-[0.2em] text-ink uppercase transition-colors duration-300 ease-out hover:text-accent"
    >
      {/* Le contour se trace en accent au survol, dans le sens des aiguilles
          d'une montre — façon verrouillage de cible plutôt qu'un simple
          changement de couleur statique. */}
      <span className="pointer-events-none absolute top-0 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-300 ease-out group-hover:scale-x-100" />
      <span className="pointer-events-none absolute top-0 right-0 h-full w-px origin-top scale-y-0 bg-accent transition-transform duration-300 delay-150 ease-out group-hover:scale-y-100" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-px w-full origin-right scale-x-0 bg-accent transition-transform duration-300 delay-300 ease-out group-hover:scale-x-100" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-full w-px origin-bottom scale-y-0 bg-accent transition-transform delay-[450ms] duration-300 ease-out group-hover:scale-y-100" />

      <span className="relative">{children}</span>
      <span
        aria-hidden
        className="relative inline-block transition-transform duration-300 ease-out group-hover:translate-x-1.5"
      >
        →
      </span>
    </Link>
  )
}
