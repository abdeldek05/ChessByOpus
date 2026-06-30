import { useEffect, useRef, useState } from 'react'

const FEEDBACK_DURATION_MS = 1800

type CopyStatus = 'idle' | 'copied' | 'error'

interface UseCopyToClipboardResult {
  status: CopyStatus
  copy: (text: string) => void
}

/** Copie un texte dans le presse-papiers et expose un état temporaire. */
export function useCopyToClipboard(): UseCopyToClipboardResult {
  const [status, setStatus] = useState<CopyStatus>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const copy = (text: string) => {
    const resetSoon = (next: CopyStatus) => {
      setStatus(next)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setStatus('idle'), FEEDBACK_DURATION_MS)
    }

    navigator.clipboard
      .writeText(text)
      .then(() => resetSoon('copied'))
      .catch(() => resetSoon('error'))
  }

  return { status, copy }
}
