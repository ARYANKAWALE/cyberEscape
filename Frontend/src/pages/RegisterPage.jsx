import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, UserPlus } from 'lucide-react'
import AuthLayout from '../components/auth/AuthLayout.jsx'
import FormField from '../components/auth/FormField.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import {
  PASSWORD_MIN_LENGTH,
  isClean,
  validateConfirm,
  validateEmail,
  validateName,
  validatePassword,
} from '../lib/validation.js'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
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
      name: validateName(form.name),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirm: validateConfirm(form.password, form.confirm),
    }
    setErrors(nextErrors)
    if (!isClean(nextErrors)) return

    setSubmitting(true)
    try {
      await register({ name: form.name, email: form.email, password: form.password })
      navigate('/', { replace: true })
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      eyebrow="// NEW TEAM ENROLLMENT"
      title="REGISTER CLEARANCE"
      subtitle="Create a team profile to begin the intrusion simulation."
      footer={
        <>
          Already cleared?{' '}
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-cyber-cyan underline-offset-4 hover:underline"
          >
            <span>Sign in</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField
          label="TEAM NAME"
          type="text"
          name="name"
          autoComplete="name"
          placeholder="e.g. Team CyberAlpha"
          value={form.name}
          onChange={update('name')}
          error={errors.name}
          autoFocus
        />

        <FormField
          label="EMAIL"
          type="text"
          name="email"
          autoComplete="email"
          placeholder="user@gmail.com"
          value={form.email}
          onChange={update('email')}
          error={errors.email}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField
            label="PASSWORD"
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            hint={`Minimum ${PASSWORD_MIN_LENGTH} characters.`}
          />
          <FormField
            label="CONFIRM PASSWORD"
            type="password"
            name="confirm"
            autoComplete="new-password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={update('confirm')}
            error={errors.confirm}
          />
        </div>

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
          <UserPlus className="size-4" />
          <span>{submitting ? 'ENROLLING…' : 'CREATE TEAM'}</span>
        </button>
      </form>
    </AuthLayout>
  )
}
