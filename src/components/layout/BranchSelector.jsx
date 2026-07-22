import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Building2 } from 'lucide-react'
import { apiGet } from '../../utils/api'
import { useBranch } from '../../context/BranchContext'

export default function BranchSelector() {
  const navigate = useNavigate()
  const { currentBranch, setBranch, clearBranch } = useBranch()
  const [branches, setBranches] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
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
    const onClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const label = currentBranch ? currentBranch.name : 'All Branches'

  const handleSelectAll = () => {
    clearBranch()
    setOpen(false)
    navigate('/superadmin')
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
        className="inline-flex max-w-[220px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Building2 className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate">{loading ? 'Loading…' : label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
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
            All Branches
          </button>
          <div className="border-t border-slate-100 dark:border-slate-800" />
          {branches.map((branch) => (
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
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{branch.city}</span>
            </button>
          ))}
          {!loading && branches.length === 0 && (
            <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">No branches available</p>
          )}
        </div>
      )}
    </div>
  )
}
