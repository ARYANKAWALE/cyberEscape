import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, LogIn } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormField from '../components/auth/FormField.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { isClean, validateEmail } from '../lib/validation.js'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/'
  const registeredEmail = location.state?.registeredEmail ?? ''

  const [form, setForm] = useState({ email: registeredEmail, password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextErrors = {
      email: validateEmail(form.email),
      password: form.password ? '' : 'Password is required.',
    }
    setErrors(nextErrors)
    if (!isClean(nextErrors)) return

    setSubmitting(true)
    try {
      await login(form)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="// AUTHENTICATION GATE"
      title="TEAM LOGIN"
      subtitle="Sign in to resume your mission. Access is verified locally on this device."
      footer={
        <>
          New team?{' '}
          <Link
            to="/register"
            className="inline-flex items-center gap-1 text-cyber-cyan underline-offset-4 hover:underline"
          >
            <span>Register clearance</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField
          label="EMAIL"
          type="text"
          name="email"
          autoComplete="email"
          placeholder="user@gmail.com"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
          autoFocus={!registeredEmail}
        />

        <FormField
          label="PASSWORD"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          autoFocus={Boolean(registeredEmail)}
        />

        <div
          className="min-h-[22px] text-sm leading-relaxed text-cyber-red"
          role="alert"
          aria-live="polite"
        >
          {formError}
        </div>

        <button
          type="submit"
          className="btn btn-primary flex w-full items-center justify-center gap-2"
          disabled={submitting}
        >
          <LogIn className="size-4" />
          <span>{submitting ? 'VERIFYING…' : 'AUTHENTICATE'}</span>
        </button>
      </form>
    </AuthLayout>
  )
}
