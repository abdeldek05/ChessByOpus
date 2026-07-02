import { useLayoutEffect, useState } from 'react'

interface GuideStep {
  selector: string
  title: string
  text: string
}

interface MesangeGuideProps {
  onClose: () => void
}

const STEPS: GuideStep[] = [
  {
    selector: '[data-guide="role"]',
    title: 'Le rôle de la Mesange',
    text: 'Roi = la menace principale (la vraie cible). Dame = leurre principal qui l’imite. Pion = leurre de saturation, lancé en nombre.',
  },
  {
    selector: '[data-guide="azimuth"]',
    title: 'Direction de tir',
    text: 'Tournez la boussole pour orienter le tir. La fusée pointe dans la direction choisie.',
  },
  {
    selector: '[data-guide="inclination"]',
    title: 'Angle de tir',
    text: 'Inclinez la fusée : la trajectoire balistique se redessine en direct (plus vertical = plus haut, moins loin).',
  },
  {
    selector: '[data-guide="add"]',
    title: 'Composez le scénario',
    text: 'Ajoutez d’autres Mesanges pour combiner menace et leurres.',
  },
]

const PAD = 8

export function MesangeGuide({ onClose }: MesangeGuideProps) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const isLast = index === STEPS.length - 1

  useLayoutEffect(() => {
    const el = document.querySelector(STEPS[index].selector)
    if (!el) {
      setRect(null)
      return
    }
    // Scroll instantané puis mesure à la frame suivante : le halo/la bulle
    // animent alors leur position via la transition CSS (fluide).
    el.scrollIntoView({ block: 'center' })
    const measure = () => setRect(el.getBoundingClientRect())
    const raf = requestAnimationFrame(() => requestAnimationFrame(measure))
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [index])

  const captionTop = rect ? Math.min(rect.bottom + 14, window.innerHeight - 190) : window.innerHeight / 2
  const captionLeft = rect ? Math.min(Math.max(rect.left, 16), window.innerWidth - 340) : window.innerWidth / 2 - 160

  return (
    <div className="fixed inset-0 z-50">
      {/* Voile + trou lumineux sur l'élément ciblé */}
      {rect && (
        <div
          className="pointer-events-none absolute rounded-2xl ring-2 ring-accent/70 transition-all duration-300"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgb(0 0 0 / 0.72)',
          }}
        />
      )}

      {/* Bulle d'explication */}
      <div
        className="absolute w-[320px] rounded-2xl bg-surface p-5 shadow-2xl shadow-black/50 transition-all duration-300 ease-out"
        style={{ top: captionTop, left: captionLeft }}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wide text-ink-faint">
            {index + 1} / {STEPS.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-ink-faint transition-colors hover:text-ink"
          >
            Passer
          </button>
        </div>

        <h3 className="mt-2 text-base font-semibold text-ink">{STEPS[index].title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-dim">{STEPS[index].text}</p>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
            className="text-xs font-medium text-ink-dim transition-colors hover:text-ink disabled:opacity-0"
          >
            ← Précédent
          </button>
          <button
            type="button"
            onClick={() => (isLast ? onClose() : setIndex((i) => i + 1))}
            className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-bg transition-colors hover:bg-accent-bright"
          >
            {isLast ? 'Compris' : 'Suivant →'}
          </button>
        </div>
      </div>
    </div>
  )
}
