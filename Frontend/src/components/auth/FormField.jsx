import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function FormField({ label, error, hint, className = '', type, ...inputProps }) {
  const id = useId()
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type

  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-[11px] tracking-[1.5px] text-[#a6cbe2]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={effectiveType}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`input-cyber ${isPassword ? 'pr-11' : ''} ${
            error
              ? 'border-cyber-red focus:border-cyber-red focus:shadow-[0_0_0_3px_#ff5e7a22]'
              : ''
          }`}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#5e8ca7] transition hover:text-[#35f4d0] focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="size-4.5" />
            ) : (
              <Eye className="size-4.5" />
            )}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mb-0 mt-1.5 text-xs text-cyber-red">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mb-0 mt-1.5 text-[11px] text-cyber-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
