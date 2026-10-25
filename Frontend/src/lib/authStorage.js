/**
 * Local, browser-only credential store.
 *
 * The original game advertised "LOCAL MODE // NO DATA SENT", so auth follows the
 * same principle: accounts live in localStorage and passwords are never stored
 * in plain text (salted SHA-256 via Web Crypto). This is a demo-grade store and
 * should be swapped for a real backend before any production use.
 */

import { registerUserApi } from './api.js'

const USERS_KEY = 'cer.users'
const SESSION_KEY = 'cer.session'

// ── Admin credentials from environment variables ─────────────────────────────
export const ADMIN_EMAIL    = import.meta.env.VITE_ADMIN_EMAIL || 'admin@cyberescape.com'
export const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'Admin@1234'
export const ADMIN_NAME     = import.meta.env.VITE_ADMIN_NAME || 'Admin'


function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function randomSalt() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return toHex(bytes.buffer)
}

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return toHex(digest)
}

export function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

export function getUsers() {
  return readJSON(USERS_KEY, [])
}

export function removeUser(userId) {
  if (!userId) return
  const users = getUsers().filter((u) => u.id !== userId)
  writeJSON(USERS_KEY, users)
}

export function findUserByEmail(email) {
  const target = normalizeEmail(email)
  return getUsers().find((u) => u.email === target) ?? null
}

export async function createUser({ name, email, password }) {
  const users = getUsers()
  const normalized = normalizeEmail(email)

  if (users.some((u) => u.email === normalized)) {
    throw new Error('An operative with this email already exists.')
  }

  const salt = randomSalt()
  const passwordHash = await hashPassword(password, salt)
  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalized,
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  }

  writeJSON(USERS_KEY, [...users, user])
  registerUserApi(user).catch(() => {})
  return toPublicUser(user)
}

export async function verifyCredentials({ email, password }) {
  const user = findUserByEmail(email)
  if (!user) return null

  const candidate = await hashPassword(password, user.salt)
  return candidate === user.passwordHash ? toPublicUser(user) : null
}

export function toPublicUser(user) {
  const { id, name, email, createdAt, isAdmin } = user
  return { id, name, email, createdAt, isAdmin: Boolean(isAdmin) }
}

/**
 * Seeds the hardcoded admin account into localStorage on first app load.
 * Safe to call multiple times — no-op if admin already exists.
 */
export async function seedAdmin() {
  const users = getUsers()
  const normalized = normalizeEmail(ADMIN_EMAIL)
  if (users.some((u) => u.email === normalized)) return // already seeded

  const salt = randomSalt()
  const passwordHash = await hashPassword(ADMIN_PASSWORD, salt)
  const adminUser = {
    id: crypto.randomUUID(),
    name: ADMIN_NAME,
    email: normalized,
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
    isAdmin: true,
  }
  writeJSON(USERS_KEY, [...users, adminUser])
}

export function getSession() {
  const session = readJSON(SESSION_KEY, null)
  if (!session?.userId) return null

  const user = getUsers().find((u) => u.id === session.userId)
  return user ? toPublicUser(user) : null
}

export function setSession(user) {
  writeJSON(SESSION_KEY, { userId: user.id, startedAt: new Date().toISOString() })
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}
