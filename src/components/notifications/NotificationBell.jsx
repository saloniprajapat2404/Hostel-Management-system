import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  BedDouble,
  ClipboardList,
  IndianRupee,
  MessageSquare,
} from 'lucide-react'
import { apiGet, apiPatch } from '../../utils/api'
import { NOTIFICATIONS_REFRESH } from '../../utils/notifications'

const TYPE_META = {
  ADMISSION: { icon: ClipboardList, dot: '#3B82F6' },
  COMPLAINT: { icon: MessageSquare, dot: '#F59E0B' },
  NOTICE: { icon: Bell, dot: '#64748B' },
  ALLOCATION: { icon: BedDouble, dot: '#10B981' },
  FEE: { icon: IndianRupee, dot: '#10B981' },
  SYSTEM: { icon: Bell, dot: '#64748B' },
}

function formatWhen(iso) {
  if (!iso) return 'Recently'
  try {
    const then = new Date(iso)
    const diff = Date.now() - then.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d ago`
    return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  } catch {
    return 'Recently'
  }
}

function NotificationRow({ item, onOpen, variant = 'dashboard' }) {
  const meta = TYPE_META[item.type] || TYPE_META.SYSTEM
  const Icon = meta.icon
  const isShell = variant === 'shell'

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={[
        'flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors',
        isShell
          ? 'hover:bg-slate-50 dark:hover:bg-slate-800'
          : 'hover:bg-[var(--dash-hover)]',
        !item.read
          ? isShell
            ? 'bg-slate-50 dark:bg-slate-800/60'
            : 'bg-[color-mix(in_srgb,var(--dash-hover)_60%,transparent)]'
          : '',
      ].join(' ')}
    >
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ background: `${meta.dot}12`, color: meta.dot }}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span
            className={[
              'truncate text-[13px] font-medium',
              isShell ? 'text-slate-900 dark:text-white' : 'text-[var(--dash-text)]',
            ].join(' ')}
          >
            {item.title}
          </span>
          {!item.read && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#3B82F6]" aria-hidden="true" />
          )}
        </span>
        {item.message && (
          <span
            className={[
              'mt-0.5 block truncate text-[12px]',
              isShell ? 'text-slate-500 dark:text-slate-400' : 'text-[var(--dash-muted)]',
            ].join(' ')}
          >
            {item.message}
          </span>
        )}
        <time
          className={[
            'mt-1 block text-[11px] tabular-nums',
            isShell ? 'text-slate-400 dark:text-slate-500' : 'text-[var(--dash-muted)]',
          ].join(' ')}
          dateTime={item.createdAt}
        >
          {formatWhen(item.createdAt)}
        </time>
      </span>
    </button>
  )
}


export default function NotificationBell({ variant = 'dashboard' }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const panelRef = useRef(null)
  const btnRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiGet('/api/notifications')
      const apiItems = data?.items || []
      setItems(apiItems)
      setUnreadCount(Number(data?.unreadCount || 0))
    } catch {
      setItems([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    const onRefresh = () => load()
    window.addEventListener(NOTIFICATIONS_REFRESH, onRefresh)
    return () => {
      clearInterval(interval)
      window.removeEventListener(NOTIFICATIONS_REFRESH, onRefresh)
    }
  }, [load])

  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event) => {
      if (
        panelRef.current?.contains(event.target) ||
        btnRef.current?.contains(event.target)
      ) {
        return
      }
      setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  const handleOpen = async (item) => {
    if (!item.read) {
      try {
        await apiPatch(`/api/notifications/${item.id}/read`)
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
        )
        setUnreadCount((count) => Math.max(0, count - 1))
      } catch {
        /* optional */
      }
    }
    setOpen(false)
    if (item.linkPath) navigate(item.linkPath)
  }

  const handleMarkAllRead = async () => {
    try {
      await apiPatch('/api/notifications/read-all')
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    }
  }

  const buttonClass =
    variant === 'dashboard'
      ? 'dashboard-icon-btn relative shrink-0'
      : 'relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'

  const isShell = variant === 'shell'

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        className={buttonClass}
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value)
          if (!open) load()
        }}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className={[
            'absolute right-0 z-50 mt-2 w-[min(92vw,360px)] overflow-hidden rounded-[14px] border shadow-2xl',
            isShell
              ? 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
              : '',
          ].join(' ')}
          style={
            isShell
              ? { boxShadow: '0 20px 48px rgba(15, 23, 42, 0.18)' }
              : {
                  borderColor: 'var(--dash-border, rgb(226 232 240))',
                  background: 'var(--dash-surface, white)',
                  boxShadow: '0 20px 48px rgba(15, 23, 42, 0.18)',
                }
          }
          role="dialog"
          aria-label="Notifications"
        >
          <div
            className={[
              'flex items-center justify-between border-b px-3 py-2.5',
              isShell ? 'border-slate-200 dark:border-slate-700' : '',
            ].join(' ')}
            style={isShell ? undefined : { borderColor: 'var(--dash-border-subtle, rgb(226 232 240))' }}
          >
            <p
              className={[
                'text-[14px] font-semibold',
                isShell ? 'text-slate-900 dark:text-white' : 'text-[var(--dash-text, rgb(15 23 42))]',
              ].join(' ')}
            >
              Notifications
            </p>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="text-[12px] font-medium text-[#3B82F6] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark All As Read
            </button>
          </div>

          <div className="max-h-[320px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {loading && items.length === 0 ? (
              <p
                className={[
                  'px-3 py-6 text-center text-[13px]',
                  isShell ? 'text-slate-500 dark:text-slate-400' : 'text-[var(--dash-muted, rgb(100 116 139))]',
                ].join(' ')}
              >
                Loading…
              </p>
            ) : items.length === 0 ? (
              <p
                className={[
                  'px-3 py-6 text-center text-[13px]',
                  isShell ? 'text-slate-500 dark:text-slate-400' : 'text-[var(--dash-muted, rgb(100 116 139))]',
                ].join(' ')}
              >
                No notifications yet.
              </p>
            ) : (
              <ul
                className={[
                  'divide-y',
                  isShell ? 'divide-slate-200 dark:divide-slate-700' : 'divide-[color:var(--dash-border-subtle,rgb(226_232_240))]',
                ].join(' ')}
              >
                {items.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <NotificationRow item={item} onOpen={handleOpen} variant={variant} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div
            className={[
              'border-t px-3 py-2 text-right',
              isShell ? 'border-slate-200 dark:border-slate-700' : '',
            ].join(' ')}
            style={isShell ? undefined : { borderColor: 'var(--dash-border-subtle, rgb(226 232 240))' }}
          >
            <Link
              to="/app/notices"
              onClick={() => setOpen(false)}
              className="text-[12px] font-medium text-[#3B82F6] hover:underline"
            >
              View notice →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
