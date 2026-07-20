import { memo, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  BedDouble,
  ClipboardList,
  IndianRupee,
  MessageSquare,
} from 'lucide-react'

const TYPE_META = {
  admission: { icon: ClipboardList, dot: '#3B82F6' },
  allocation: { icon: BedDouble, dot: '#10B981' },
  fee: { icon: IndianRupee, dot: '#10B981' },
  complaint: { icon: MessageSquare, dot: '#F59E0B' },
  notice: { icon: Bell, dot: '#64748B' },
}

const VIEW_ALL = {
  SUPER_ADMIN: '/app/activity',
  ADMIN: '/app/activity',
  WARDEN: '/app/activity',
  STUDENT: '/app/activity',
}

function formatWhen(iso) {
  if (!iso) return 'Recently'
  try {
    const then = new Date(iso)
    const diff = Date.now() - then.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins} min ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return hrs === 1 ? '1 hour ago' : `${hrs} hours ago`
    const days = Math.floor(hrs / 24)
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  } catch {
    return 'Recently'
  }
}

function ActivityRow({ item }) {
  const meta = TYPE_META[item.type] || TYPE_META.notice
  const Icon = meta.icon

  return (
    <li>
      <div
        className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-[var(--dash-hover)]"
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: `${meta.dot}12`, color: meta.dot }}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium leading-tight text-[var(--dash-text)]">
            {item.title}
          </p>
          {item.subtitle && (
            <p className="mt-0.5 truncate text-[12px] leading-tight text-[var(--dash-muted)]">
              {item.subtitle}
            </p>
          )}
        </div>
        <time
          className="shrink-0 text-[11px] tabular-nums text-[var(--dash-muted)]"
          dateTime={item.at || undefined}
        >
          {formatWhen(item.at)}
        </time>
      </div>
    </li>
  )
}

function RecentActivityTimeline({ items = [], role = 'STUDENT', loading = false }) {
  const sorted = useMemo(
    () =>
      [...items]
        .filter((i) => i?.title)
        .sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0)),
    [items],
  )

  const viewAllHref = VIEW_ALL[role] || '/app/activity'
  const hasScroll = sorted.length > 5

  if (loading) {
    return (
      <section>
        <h3 className="dashboard-section-label">Recent activity</h3>
        <div className="dashboard-surface-card h-[280px] animate-pulse" />
      </section>
    )
  }

  return (
    <section>
      <h3 className="dashboard-section-label">Recent activity</h3>
      <div
        className="dashboard-surface-card flex h-[280px] flex-col overflow-hidden"
      >
        {sorted.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-4">
            <p className="text-[13px] text-[var(--dash-muted)]">No recent activity.</p>
          </div>
        ) : (
          <ul
            className={`min-h-0 flex-1 divide-y divide-[color:var(--dash-border-subtle)] ${hasScroll ? 'overflow-y-auto' : 'overflow-hidden'}`}
            style={{ scrollbarWidth: 'thin' }}
          >
            {sorted.map((item, idx) => (
              <ActivityRow key={item.id || idx} item={item} />
            ))}
          </ul>
        )}

        <div
          className="flex shrink-0 justify-end border-t px-3 py-2"
          style={{ borderColor: 'var(--dash-border-subtle)' }}
        >
          <Link
            to={viewAllHref}
            className="text-[12px] font-medium text-[#3B82F6] transition-colors hover:text-[#2563EB]"
          >
            View all activity →
          </Link>
        </div>
      </div>
    </section>
  )
}

export default memo(RecentActivityTimeline)
