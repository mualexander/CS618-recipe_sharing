import { signup } from '../api/auth.js'
import { AuthForm } from './AuthForm.jsx'

export function SignupPage() {
  return <AuthForm mode="signup" submit={signup} />
}
