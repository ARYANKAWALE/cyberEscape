export const PASSWORD_MIN_LENGTH = 8

export function validateEmail(email) {
  if (!email || !email.trim()) return 'Email is required.'
  return ''
}

export function validatePassword(password) {
  if (!password) return 'Password is required.'
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  return ''
}

export function validateName(name) {
  if (!name.trim()) return 'Operative name is required.'
  if (name.trim().length < 2) return 'Name must be at least 2 characters.'
  return ''
}

export function validateConfirm(password, confirm) {
  if (!confirm) return 'Please confirm your password.'
  if (password !== confirm) return 'Passwords do not match.'
  return ''
}

/** Returns true when no field has a validation message. */
export function isClean(errors) {
  return Object.values(errors).every((msg) => !msg)
}
