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
    title: 'The Mesange role',
    text: 'King = the main threat (the real target). Queen = the primary decoy that mimics it. Pawn = saturation decoy, launched in numbers.',
  },
  {
    selector: '[data-guide="azimuth"]',
    title: 'Firing direction',
    text: 'Turn the compass to aim the shot. The rocket points in the chosen direction.',
  },
  {
    selector: '[data-guide="inclination"]',
    title: 'Firing angle',
    text: 'Tilt the rocket: the ballistic trajectory redraws live (more vertical = higher, shorter range).',
  },
  {
    selector: '[data-guide="add"]',
    title: 'Build the scenario',
    text: 'Add more Mesanges to combine threat and decoys.',
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
            Skip
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
            ← Back
          </button>
          <button
            type="button"
            onClick={() => (isLast ? onClose() : setIndex((i) => i + 1))}
            className="rounded-full bg-accent px-5 py-2 text-xs font-semibold text-bg transition-colors hover:bg-accent-bright"
          >
            {isLast ? 'Got it' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
