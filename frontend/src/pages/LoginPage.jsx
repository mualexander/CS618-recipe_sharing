import { login } from '../api/auth.js'
import { AuthForm } from './AuthForm.jsx'

export function LoginPage() {
  return <AuthForm mode="login" submit={login} />
}
