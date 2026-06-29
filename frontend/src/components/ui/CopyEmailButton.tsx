import { Check, Copy, X } from 'lucide-react'
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard'
import { useMagneticHover } from '@/hooks/useMagneticHover'

interface CopyEmailButtonProps {
  email: string
}

export function CopyEmailButton({ email }: CopyEmailButtonProps) {
  const { status, copy } = useCopyToClipboard()
  const magneticRef = useMagneticHover<HTMLButtonElement>()

  const label =
    status === 'copied' ? 'Adresse copiée' : status === 'error' ? 'Échec de la copie' : "Copier l'adresse e-mail"

  return (
    <button
      ref={magneticRef}
      type="button"
      onClick={() => copy(email)}
      aria-label={label}
      className="flex size-11 items-center justify-center border border-border text-ink-dim transition-[transform,color,border-color] duration-300 ease-out hover:border-accent hover:text-accent"
    >
      {status === 'copied' ? (
        <Check className="size-4 text-ok" strokeWidth={1.5} />
      ) : status === 'error' ? (
        <X className="size-4 text-alert" strokeWidth={1.5} />
      ) : (
        <Copy className="size-4" strokeWidth={1.5} />
      )}
    </button>
  )
}
