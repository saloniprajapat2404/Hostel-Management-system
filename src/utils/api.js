import { clearSession, getToken } from './auth'

async function parseError(res) {
  try {
    const data = await res.json()
    return data.message || data.error || `Request failed (${res.status})`
  } catch {
    return `Request failed (${res.status})`
  }
}

async function request(method, path, body) {
  const token = getToken()
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    clearSession()
    if (window.location.pathname !== '/') {
      window.location.assign('/')
    }
    throw new Error('Session expired. Please sign in again.')
  }

  if (!res.ok) {
    throw new Error(await parseError(res))
  }

  if (res.status === 204) return null
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export function apiGet(path) {
  return request('GET', path)
}

export function apiPost(path, body) {
  return request('POST', path, body)
}

export function apiPut(path, body) {
  return request('PUT', path, body)
}

export function apiPatch(path, body) {
  return request('PATCH', path, body)
}

export function apiDelete(path) {
  return request('DELETE', path)
}
