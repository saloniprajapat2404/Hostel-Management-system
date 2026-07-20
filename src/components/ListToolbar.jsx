import { useMemo, useState } from 'react'
import { ArrowDownAZ, ArrowUpAZ, Search } from 'lucide-react'
import { fieldClass } from './ui/Page'

/**
 * Shared search / filter / sort toolbar for list pages.
 */
export default function ListToolbar({
  search = '',
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters = [],
  sortOptions = [],
  sortKey = '',
  sortDir = 'asc',
  onSortKeyChange,
  onSortDirChange,
  rightSlot = null,
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 sm:flex-row sm:flex-wrap sm:items-center">
      {onSearchChange && (
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${fieldClass} pl-9`}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
      )}

      {filters.map((filter) => (
        <select
          key={filter.key}
          className={`${fieldClass} sm:w-auto`}
          value={filter.value}
          onChange={(e) => filter.onChange(e.target.value)}
          aria-label={filter.label}
        >
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {sortOptions.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            className={`${fieldClass} sm:w-auto`}
            value={sortKey}
            onChange={(e) => onSortKeyChange?.(e.target.value)}
            aria-label="Sort by"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => onSortDirChange?.(sortDir === 'asc' ? 'desc' : 'asc')}
            aria-label={sortDir === 'asc' ? 'Sort ascending' : 'Sort descending'}
            title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDir === 'asc' ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
          </button>
        </div>
      )}

      {rightSlot}
    </div>
  )
}

export function useListControls(items, { searchKeys = [], initialSortKey = '', getSortValue } = {}) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState(initialSortKey)
  const [sortDir, setSortDir] = useState('asc')

  const filtered = useMemo(() => {
    let next = [...(items || [])]
    const q = search.trim().toLowerCase()
    if (q && searchKeys.length) {
      next = next.filter((item) =>
        searchKeys.some((key) => String(item?.[key] ?? '').toLowerCase().includes(q)),
      )
    }
    if (sortKey) {
      next.sort((a, b) => {
        const av = getSortValue ? getSortValue(a, sortKey) : a?.[sortKey]
        const bv = getSortValue ? getSortValue(b, sortKey) : b?.[sortKey]
        const an = typeof av === 'number' ? av : String(av ?? '').toLowerCase()
        const bn = typeof bv === 'number' ? bv : String(bv ?? '').toLowerCase()
        if (an < bn) return sortDir === 'asc' ? -1 : 1
        if (an > bn) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }
    return next
  }, [items, search, searchKeys, sortKey, sortDir, getSortValue])

  return {
    search,
    setSearch,
    sortKey,
    setSortKey,
    sortDir,
    setSortDir,
    filtered,
  }
}
