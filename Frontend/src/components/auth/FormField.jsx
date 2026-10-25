import { useId } from 'react'

export default function FormField({ label, error, hint, className = '', ...inputProps }) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-[11px] tracking-[1.5px] text-[#a6cbe2]">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`input-cyber ${error ? 'border-cyber-red focus:border-cyber-red focus:shadow-[0_0_0_3px_#ff5e7a22]' : ''}`}
        {...inputProps}
      />
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
