const TOKEN_KEY = 'hms_token'
const USER_KEY = 'hms_user'

export function validateIdentifier(value) {
  const trimmed = value.trim()
  if (!trimmed) return false
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const studentIdPattern = /^[a-zA-Z0-9._-]{3,}$/
  return emailPattern.test(trimmed) || studentIdPattern.test(trimmed)
}

export async function login({ identifier, password }) {
  let res
  try {
    res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: identifier.trim(),
      password,
    }),
    })
  } catch {
    throw new Error('Cannot reach the server. Start the backend on port 8080, then try again.')
  }

  if (!res.ok) {
    let message = 'Invalid credentials. Please try again.'
    try {
      const data = await res.json()
      message = data.message || message
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  return res.json()
}

export function saveSession({ token, user }, remember) {
  const storage = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  other.removeItem(TOKEN_KEY)
  other.removeItem(USER_KEY)
  storage.setItem(TOKEN_KEY, token)
  storage.setItem(USER_KEY, JSON.stringify(user))
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

export function getSession() {
  const raw =
    localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
}

export function isAuthenticated() {
  return Boolean(getToken())
}
