import { ArrowDown, ArrowLeft, ArrowUp, ArrowUpDown, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function BackButton({ fallback = '/app', className = '' }) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(fallback)
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      title="Back"
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.25} />
    </button>
  )
}

export function PageHeader({ title, subtitle, actions, showBack = true, backTo = '/app' }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {showBack && <BackButton fallback={backTo} className="mt-0.5" />}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2 sm:ml-auto">{actions}</div>}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {children}
    </div>
  )
}

export function LoadingBlock({ label = 'Loading…' }) {
  return (
    <Card>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </Card>
  )
}

export function ErrorBlock({ message, onRetry }) {
  return (
    <Card className="border-red-200 dark:border-red-900/50">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Retry
        </button>
      )}
    </Card>
  )
}

export function EmptyBlock({ message = 'No records found.' }) {
  return (
    <Card>
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
    </Card>
  )
}

export function StatusBadge({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    green: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    teal: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone] || tones.slate}`}>
      {children}
    </span>
  )
}

export function Table({ headers, children, sortableHeaders, sortKey, sortDir, onSort }) {
  const useSortable = Array.isArray(sortableHeaders) && sortableHeaders.length > 0

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-slate-800">
        <thead className="bg-slate-50 dark:bg-slate-800/60">
          <tr>
            {useSortable
              ? sortableHeaders.map((column) => (
                  <SortableTh
                    key={column.key}
                    label={column.label}
                    sortKey={column.key}
                    activeKey={sortKey}
                    sortDir={sortDir}
                    onSort={onSort}
                    sortable={column.sortable !== false}
                  />
                ))
              : headers.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                  >
                    {h}
                  </th>
                ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{children}</tbody>
      </table>
    </div>
  )
}

export function SortableTh({ label, sortKey, activeKey, sortDir, onSort, sortable = true }) {
  const active = sortKey === activeKey
  const Icon = active ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown

  if (!sortable) {
    return (
      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </th>
    )
  }

  return (
    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
      <button
        type="button"
        onClick={() => onSort?.(sortKey)}
        className="inline-flex items-center gap-1 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
      >
        {label}
        <Icon className={`h-3.5 w-3.5 ${active ? 'text-primary' : 'opacity-40'}`} aria-hidden="true" />
      </button>
    </th>
  )
}

export function TableToolbar({ children, className = '' }) {
  return (
    <div className={`mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center ${className}`}>
      {children}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative min-w-[200px] flex-1 ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        className={`${fieldClass} pl-9`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

export function FilterSelect({ value, onChange, children, className = '' }) {
  return (
    <select className={`${fieldClass} sm:w-auto ${className}`} value={value} onChange={(e) => onChange(e.target.value)}>
      {children}
    </select>
  )
}

export function ActionButton({ children, variant = 'primary', className = '', type = 'button', ...props }) {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    ghost: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  }
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Field({ label, children, required = false, className = '' }) {
  return (
    <label className={`block space-y-1.5 ${className}`.trim()}>
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
        {required ? (
          <span className="ml-0.5 font-semibold text-red-600 dark:text-red-400" aria-hidden="true">
            *
          </span>
        ) : null}
      </span>
      {children}
    </label>
  )
}

export const fieldClass =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-primary-light dark:focus:bg-slate-800 dark:focus:ring-primary-light/15'
