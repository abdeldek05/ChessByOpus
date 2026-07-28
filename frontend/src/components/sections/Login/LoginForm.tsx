import { useLoginForm } from '@/hooks/useLoginForm'
import { LoginField } from './LoginField'
import { LoginSubmitButton } from './LoginSubmitButton'
import { LoginError } from './LoginError'

/** Formulaire de connexion : deux champs, une erreur, un bouton. */
export function LoginForm() {
  const { username, password, error, isSubmitting, setUsername, setPassword, submit } =
    useLoginForm()

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-7">
      <LoginField
        id="username"
        label="ID"
        type="text"
        value={username}
        autoComplete="username"
        autoFocus
        disabled={isSubmitting}
        onChange={setUsername}
      />

      <LoginField
        id="password"
        label="Password"
        type="password"
        value={password}
        autoComplete="current-password"
        disabled={isSubmitting}
        onChange={setPassword}
      />

      {error && <LoginError message={error} />}

      <LoginSubmitButton isSubmitting={isSubmitting} />
    </form>
  )
}
