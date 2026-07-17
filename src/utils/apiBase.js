/** Production API origin, e.g. https://hostel-api.example.com (no trailing slash). Empty = same-origin / Vite proxy. */
export function apiUrl(path) {
  const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  if (!path.startsWith('/')) return `${base}/${path}`
  return `${base}${path}`
}
