const DEMO_PASSWORD = 'demo123'
const AUTH_DELAY_MS = 1500

export function validateIdentifier(value) {
  const trimmed = value.trim()
  if (!trimmed) return false
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const studentIdPattern = /^[a-zA-Z0-9._-]{3,}$/
  return emailPattern.test(trimmed) || studentIdPattern.test(trimmed)
}

export async function mockLogin({ identifier, password }) {
  await new Promise((resolve) => setTimeout(resolve, AUTH_DELAY_MS))

  const trimmedId = identifier.trim()
  const failsDemo =
    password === 'wrongpass' || trimmedId.toLowerCase() === 'fail@test.com'

  if (
    !validateIdentifier(trimmedId) ||
    password.length < 6 ||
    failsDemo
  ) {
    throw new Error('INVALID_CREDENTIALS')
  }

  return {
    user: {
      identifier: trimmedId,
      role: password === DEMO_PASSWORD ? 'admin' : 'student',
    },
  }
}

export function saveSession(user, remember) {
  const storage = remember ? localStorage : sessionStorage
  storage.setItem('hms_user', JSON.stringify(user))
}

export function getSession() {
  return (
    JSON.parse(localStorage.getItem('hms_user') || 'null') ||
    JSON.parse(sessionStorage.getItem('hms_user') || 'null')
  )
}

export function clearSession() {
  localStorage.removeItem('hms_user')
  sessionStorage.removeItem('hms_user')
  localStorage.removeItem('hms_guest')
  sessionStorage.removeItem('hms_guest')
}

export function setGuestMode() {
  sessionStorage.setItem('hms_guest', 'true')
}

export function isGuestMode() {
  return sessionStorage.getItem('hms_guest') === 'true'
}
