import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { apiGet } from '../utils/api'

const STORAGE_KEY = 'hms_selected_branch'

const BranchContext = createContext(null)

function readStoredBranch() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function getSelectedBranchId() {
  const branch = readStoredBranch()
  return branch?.id || null
}

export function BranchProvider({ children }) {
  const [currentBranch, setCurrentBranch] = useState(() => readStoredBranch())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const persistBranch = useCallback((branch) => {
    if (branch) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(branch))
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
    setCurrentBranch(branch)
    window.dispatchEvent(new CustomEvent('hms:branch-updated', { detail: branch }))
  }, [])

  const setBranchBySlug = useCallback(async (slug) => {
    setLoading(true)
    setError(null)
    try {
      const branch = await apiGet(`/api/branches/${encodeURIComponent(slug)}`)
      persistBranch(branch)
      return branch
    } catch (err) {
      setError(err.message || 'Failed to load branch')
      throw err
    } finally {
      setLoading(false)
    }
  }, [persistBranch])

  const setBranch = useCallback((branch) => {
    persistBranch(branch)
  }, [persistBranch])

  const clearBranch = useCallback(() => {
    persistBranch(null)
  }, [persistBranch])

  const value = useMemo(
    () => ({
      currentBranch,
      loading,
      error,
      setBranchBySlug,
      setBranch,
      clearBranch,
    }),
    [currentBranch, loading, error, setBranchBySlug, setBranch, clearBranch],
  )

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>
}

export function useBranch() {
  const ctx = useContext(BranchContext)
  if (!ctx) {
    throw new Error('useBranch must be used within BranchProvider')
  }
  return ctx
}

export default BranchContext
