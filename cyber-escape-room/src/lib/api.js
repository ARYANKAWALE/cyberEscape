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

/** URL to trigger the Excel download — open in new tab or set window.location */
export function getExportUrl() {
  return `${BASE}/api/results/export`
}
