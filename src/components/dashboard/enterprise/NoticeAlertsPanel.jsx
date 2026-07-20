import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight } from 'lucide-react'
import { apiGet, apiPatch } from '../../../utils/api'

const CATEGORY_COLORS = {
  GENERAL: '#64748B',
  FEE: '#10B981',
  MAINTENANCE: '#F59E0B',
  EMERGENCY: '#EF4444',
  EVENT: '#3B82F6',
}

function categoryLabel(value) {
  if (!value) return 'General'
  return value.charAt(0) + value.slice(1).toLowerCase().replace('_', ' ')
}

function formatWhen(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

function normalizeNotice(notice) {
  return {
    ...notice,
    description: notice.description || notice.body || '',
    status: notice.status || (notice.active === false ? 'EXPIRED' : 'ACTIVE'),
    category: notice.category || 'GENERAL',
    read: notice.read ?? false,
  }
}

function buildSummaryFromList(notices) {
  const normalized = (notices || []).map(normalizeNotice)
  const active = normalized.filter((n) => n.status === 'ACTIVE')
  return {
    totalNotices: normalized.length,
    activeNotices: active.length,
    unreadCount: active.filter((n) => !n.read).length,
    latestNotices: active.slice(0, 5),
  }
}

async function fetchNoticeSummary() {
  const summaryPaths = ['/api/notices/summary', '/api/notices/dashboard-summary']
  let lastError = null

  for (const path of summaryPaths) {
    try {
      return await apiGet(path)
    } catch (err) {
      lastError = err
      if (!String(err.message || '').toLowerCase().includes('not supported')) {
        throw err
      }
    }
  }

  try {
    return buildSummaryFromList(await apiGet('/api/notices'))
  } catch {
    throw lastError || new Error('Failed to load notices')
  }
}

export default function NoticeAlertsPanel({ role }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setSummary(await fetchNoticeSummary())
    } catch (err) {
      setError(err.message || 'Failed to load notices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleMarkRead = async (id) => {
    try {
      await apiPatch(`/api/notices/${id}/read`)
      await load()
    } catch {
      /* non-blocking */
    }
  }

  const unread = summary?.unreadCount ?? 0
  const latest = summary?.latestNotices ?? []

  return (
    <section className="dashboard-surface-card overflow-hidden p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="relative flex h-9 w-9 items-center justify-center rounded-[10px]"
            style={{ background: 'color-mix(in srgb, #3B82F6 15%, transparent)', color: '#3B82F6' }}
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--dash-text)]">Notice &amp; Alerts</h3>
            <p className="text-[12px] text-[var(--dash-muted)]">
              {loading
                ? 'Loading…'
                : `${summary?.activeNotices ?? 0} active · ${summary?.totalNotices ?? 0} total`}
            </p>
          </div>
        </div>
        <Link
          to="/app/notices"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12px] font-medium text-[#3B82F6] hover:bg-[var(--dash-hover)]"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {error && (
        <p className="mb-3 text-[12px] text-red-600 dark:text-red-400">{error}</p>
      )}

      {!loading && latest.length === 0 && (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-[12px] text-[var(--dash-muted)]" style={{ borderColor: 'var(--dash-border-subtle)' }}>
          No active notices right now.
        </p>
      )}

      {!loading && latest.length > 0 && (
        <ul className="space-y-2">
          {latest.map((notice) => {
            const color = CATEGORY_COLORS[notice.category] || CATEGORY_COLORS.GENERAL
            return (
              <li key={notice.id}>
                <button
                  type="button"
                  onClick={() => handleMarkRead(notice.id)}
                  className={[
                    'flex w-full items-start gap-3 rounded-[10px] border px-3 py-2.5 text-left transition-colors hover:bg-[var(--dash-hover)]',
                    !notice.read ? 'border-[#3B82F6]/30 bg-[color-mix(in_srgb,#3B82F6_6%,transparent)]' : '',
                  ].join(' ')}
                  style={{ borderColor: notice.read ? 'var(--dash-border-subtle)' : undefined }}
                >
                  <span
                    className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ background: color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-medium text-[var(--dash-text)]">
                        {notice.title}
                      </span>
                      {!notice.read && (
                        <span className="shrink-0 rounded-full bg-[#3B82F6] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          New
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[var(--dash-muted)]">
                      {categoryLabel(notice.category)} · {formatWhen(notice.createdAt)}
                      {role !== 'STUDENT' && notice.targetAudience
                        ? ` · ${notice.targetAudience.replaceAll('_', ' ').toLowerCase()}`
                        : ''}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
