/**
 * API client for the CyberEscape backend.
 * Base URL defaults to http://localhost:3001.
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * POST /api/results — persist a completed game session.
 *
 * @param {object} payload
 * @param {string} payload.userId
 * @param {string} payload.userName
 * @param {string} payload.completedAt  – ISO timestamp
 * @param {Array}  payload.levels       – [{ title, solved, timeTakenSeconds }]
 */
export async function saveResult(payload) {
  const res = await fetch(`${BASE}/api/results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Failed to save result.')
  }
  return res.json()
}

/**
 * GET /api/results — fetch all session records.
 * Returns: [{ id, userId, userName, completedAt, levels: [...] }]
 */
export async function fetchResults() {
  const res = await fetch(`${BASE}/api/results`)
  if (!res.ok) throw new Error('Failed to fetch results.')
  return res.json()
}

/**
 * GET /api/results/status/:userId — check if user has already submitted
 */
export async function checkUserSubmission(userId) {
  if (!userId) return { submitted: false }
  try {
    const res = await fetch(`${BASE}/api/results/status/${encodeURIComponent(userId)}`)
    if (!res.ok) return { submitted: false }
    return res.json()
  } catch {
    return { submitted: false }
  }
}

/** URL to trigger the Excel download — open in new tab or set window.location */
export function getExportUrl() {
  return `${BASE}/api/results/export`
}

/**
 * POST /api/users — register/sync an operative account to the backend.
 */
export async function registerUserApi(user) {
  if (!user || !user.id) return
  try {
    await fetch(`${BASE}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      }),
    })
  } catch (err) {
    console.warn('Could not sync user to backend:', err)
  }
}

/**
 * POST /api/users/sync — bulk sync all local users to backend.
 */
export async function syncUsersApi(users) {
  if (!Array.isArray(users) || users.length === 0) return
  try {
    await fetch(`${BASE}/api/users/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users }),
    })
  } catch (err) {
    console.warn('Could not bulk sync users to backend:', err)
  }
}

/**
 * DELETE /api/users/:userId — permanently remove a user and all their data.
 */
export async function deleteUserApi(userId) {
  const res = await fetch(`${BASE}/api/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to delete user.')
  }
  return res.json()
}
