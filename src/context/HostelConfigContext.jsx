import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiUrl } from '../utils/apiBase'

export const DEFAULT_HOSTEL_NAME = 'Takshak Hostel'
export const DEFAULT_SYSTEM_NAME = 'Hostel Management System'
export const BRANDING_KEYS = ['hostelName', 'systemName']
const STORAGE_KEY = 'hms_branding_config'

const HostelConfigContext = createContext({
  hostelName: DEFAULT_HOSTEL_NAME,
  systemName: DEFAULT_SYSTEM_NAME,
  loading: true,
  refreshConfig: async () => {},
  applyConfig: () => {},
})

function readStoredConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return normalizeConfig(JSON.parse(raw))
  } catch {
    return null
  }
}

function writeStoredConfig(config) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeConfig(config)))
  } catch {
    /* optional */
  }
}

function applyDocumentMeta(hostelName, systemName) {
  document.title = `${hostelName} — ${systemName}`
  const meta = document.querySelector('meta[name="description"]')
  if (meta) {
    meta.setAttribute(
      'content',
      `${hostelName} — ${systemName} portal for students, wardens, and administrators.`,
    )
  }
}

function normalizeConfig(data = {}) {
  return {
    hostelName: data.hostelName?.trim() || DEFAULT_HOSTEL_NAME,
    systemName: data.systemName?.trim() || DEFAULT_SYSTEM_NAME,
  }
}

export async function fetchPublicBranding() {
  const res = await fetch(apiUrl('/api/config/public'), { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load public branding')
  return normalizeConfig(await res.json())
}

export function HostelConfigProvider({ children }) {
  const stored = readStoredConfig()
  const [hostelName, setHostelName] = useState(stored?.hostelName || DEFAULT_HOSTEL_NAME)
  const [systemName, setSystemName] = useState(stored?.systemName || DEFAULT_SYSTEM_NAME)
  const [loading, setLoading] = useState(true)

  const applyConfig = useCallback((data = {}) => {
    const next = normalizeConfig(data)
    setHostelName(next.hostelName)
    setSystemName(next.systemName)
    writeStoredConfig(next)
    applyDocumentMeta(next.hostelName, next.systemName)
    return next
  }, [])

  const refreshConfig = useCallback(async () => {
    try {
      applyConfig(await fetchPublicBranding())
    } catch {
      /* keep current / defaults when API is unreachable */
    }
  }, [applyConfig])

  useEffect(() => {
    refreshConfig().finally(() => setLoading(false))
  }, [refreshConfig])

  useEffect(() => {
    const onFocus = () => {
      refreshConfig()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshConfig])

  const value = useMemo(
    () => ({ hostelName, systemName, loading, refreshConfig, applyConfig }),
    [hostelName, systemName, loading, refreshConfig, applyConfig],
  )

  return <HostelConfigContext.Provider value={value}>{children}</HostelConfigContext.Provider>
}

export function useHostelConfig() {
  return useContext(HostelConfigContext)
}

export function pickBrandingValues(values = {}) {
  return {
    hostelName: values.hostelName,
    systemName: values.systemName,
  }
}
