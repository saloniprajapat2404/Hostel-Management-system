import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Building2, MapPin } from 'lucide-react'
import { apiGet } from '../../utils/api'
import { useBranch } from '../../context/BranchContext'

export default function BranchSelector() {
  const navigate = useNavigate()
  const { currentBranch, setBranch, clearBranch } = useBranch()
  const [branches, setBranches] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedCity, setSelectedCity] = useState(null)
  const containerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const list = await apiGet('/api/branches')
        if (!cancelled) setBranches(Array.isArray(list) ? list : [])
      } catch {
        if (!cancelled) setBranches([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (currentBranch?.city) {
      setSelectedCity(currentBranch.city)
    }
  }, [currentBranch])

  useEffect(() => {
    const onClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const cities = useMemo(() => {
    const map = new Map()
    for (const branch of branches) {
      const city = branch.city || 'Unassigned'
      if (!map.has(city)) map.set(city, [])
      map.get(city).push(branch)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [branches])

  const localities = useMemo(() => {
    if (!selectedCity) return []
    return branches
      .filter((b) => (b.city || 'Unassigned') === selectedCity)
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [branches, selectedCity])

  const label = currentBranch
    ? `${currentBranch.city} · ${currentBranch.name}`
    : 'All Cities'

  const handleSelectAll = () => {
    clearBranch()
    setSelectedCity(null)
    setOpen(false)
    navigate('/superadmin')
  }

  const handleSelectCity = (city) => {
    setSelectedCity(city)
  }

  const handleSelectBranch = (branch) => {
    setBranch(branch)
    setOpen(false)
    navigate(`/superadmin/branch/${branch.slug}`)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex max-w-[260px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Building2 className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate">{loading ? 'Loading…' : label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
          role="listbox"
        >
          <button
            type="button"
            onClick={handleSelectAll}
            className={[
              'flex w-full items-center gap-2 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800',
              !currentBranch ? 'bg-primary/5 font-semibold text-primary dark:bg-primary/10' : 'text-slate-700 dark:text-slate-200',
            ].join(' ')}
          >
            <Building2 className="h-4 w-4" />
            All Cities / Overview
          </button>

          <div className="border-t border-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800">
            1. City
          </div>
          <div className="max-h-40 overflow-y-auto">
            {cities.map(([city, list]) => (
              <button
                key={city}
                type="button"
                onClick={() => handleSelectCity(city)}
                className={[
                  'flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800',
                  selectedCity === city
                    ? 'bg-primary/5 font-semibold text-primary dark:bg-primary/10'
                    : 'text-slate-700 dark:text-slate-200',
                ].join(' ')}
              >
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" />
                  {city}
                </span>
                <span className="text-xs font-normal text-slate-400">{list.length}</span>
              </button>
            ))}
          </div>

          {selectedCity && (
            <>
              <div className="border-t border-slate-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800">
                2. Locality in {selectedCity}
              </div>
              <div className="max-h-52 overflow-y-auto">
                {localities.map((branch) => (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => handleSelectBranch(branch)}
                    className={[
                      'flex w-full flex-col px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800',
                      currentBranch?.id === branch.id
                        ? 'bg-primary/5 font-semibold text-primary dark:bg-primary/10'
                        : 'text-slate-700 dark:text-slate-200',
                    ].join(' ')}
                  >
                    <span>{branch.name}</span>
                    <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                      {branch.address || selectedCity}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {!loading && branches.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">No branches available</p>
          )}
        </div>
      )}
    </div>
  )
}
