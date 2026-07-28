import { useCallback, useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { ApiError } from '@/lib/api'

/** Destination par défaut après connexion (cible du bouton « Launch »). */
const DEFAULT_REDIRECT = '/simulation'

interface LoginFormState {
  username: string
  password: string
  error: string | null
  isSubmitting: boolean
  setUsername: (value: string) => void
  setPassword: (value: string) => void
  submit: (event: FormEvent<HTMLFormElement>) => void
}

/**
 * État et soumission du formulaire de connexion. Après succès, renvoie vers la
 * page initialement demandée (`state.from` posé par `RequireAuth`) — cliquer
 * « Launch » puis se connecter mène bien à /simulation, pas à l'accueil.
 */
export function useLoginForm(): LoginFormState {
  const navigate = useNavigate()
  const location = useLocation()
  const signIn = useAuthStore((state) => state.signIn)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (isSubmitting) return

      setError(null)
      setIsSubmitting(true)

      const redirectTo = (location.state as { from?: string } | null)?.from ?? DEFAULT_REDIRECT

      signIn({ username, password })
        .then(() => navigate(redirectTo, { replace: true }))
        .catch((cause: unknown) => {
          // Le back renvoie déjà un message affichable (« Identifiants
          // invalides », « Trop de tentatives… ») : on le montre tel quel.
          setError(cause instanceof ApiError ? cause.message : 'Connexion impossible')
          setPassword('')
          setIsSubmitting(false)
        })
    },
    [isSubmitting, location.state, navigate, password, signIn, username],
  )

  return { username, password, error, isSubmitting, setUsername, setPassword, submit }
}
