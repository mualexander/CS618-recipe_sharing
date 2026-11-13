import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext.jsx'
import { Field } from '../components/Field.jsx'

// Shared form for log in and sign up; both return { token, user }.
export function AuthForm({ mode, submit }) {
  const isSignup = mode === 'signup'
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [values, setValues] = useState({ username: '', password: '', displayName: '' })

  const mutation = useMutation({
    mutationFn: submit,
    onSuccess: ({ token }) => {
      login(token)
      navigate(location.state?.from ?? '/', { replace: true })
    },
  })

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))
  const fields = mutation.error?.fields ?? {}
  const handleSubmit = (e) => {
    e.preventDefault()
    const { displayName, ...creds } = values
    mutation.mutate(isSignup ? { ...creds, displayName: displayName || undefined } : creds)
  }

  return (
    <div className="auth-card">
      <h1>{isSignup ? 'Create an account' : 'Log in'}</h1>
      <form onSubmit={handleSubmit}>
        {mutation.isError && Object.keys(fields).length === 0 && (
          <p className="error banner">{mutation.error.message}</p>
        )}
        <Field
          label="Username"
          value={values.username}
          onChange={set('username')}
          autoComplete="username"
          autoFocus
          required
          error={fields.username}
          hint={isSignup ? 'Letters, numbers, and underscores.' : undefined}
        />
        {isSignup && (
          <Field
            label="Display name (optional)"
            value={values.displayName}
            onChange={set('displayName')}
            autoComplete="name"
            maxLength={60}
            error={fields.displayName}
          />
        )}
        <Field
          label="Password"
          type="password"
          value={values.password}
          onChange={set('password')}
          autoComplete={isSignup ? 'new-password' : 'current-password'}
          required
          error={fields.password}
          hint={isSignup ? 'At least 8 characters.' : undefined}
        />
        <button type="submit" className="full" disabled={mutation.isPending}>
          {mutation.isPending ? 'Please wait…' : isSignup ? 'Sign up' : 'Log in'}
        </button>
      </form>
      <p className="muted center">
        {isSignup ? (
          <>
            Already have an account? <Link to="/login" state={location.state}>Log in</Link>
          </>
        ) : (
          <>
            New here? <Link to="/signup" state={location.state}>Create an account</Link>
          </>
        )}
      </p>
    </div>
  )
}
