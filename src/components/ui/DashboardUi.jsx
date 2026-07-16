import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import AnimatedNumber from '../dashboard/AnimatedNumber'

const TONE_STYLES = {
  default: {
    border: 'border-l-[#3B82F6]',
    glow: 'shadow-[#3B82F6]/10',
    icon: 'bg-[#3B82F6]/15 text-[#3B82F6]',
    value: 'text-white',
    gradient: 'from-[#3B82F6]/12 via-[#111827] to-[#111827]',
  },
  teal: {
    border: 'border-l-[#06B6D4]',
    glow: 'shadow-[#06B6D4]/10',
    icon: 'bg-[#06B6D4]/15 text-[#06B6D4]',
    value: 'text-[#06B6D4]',
    gradient: 'from-[#06B6D4]/12 via-[#111827] to-[#111827]',
  },
  green: {
    border: 'border-l-[#10B981]',
    glow: 'shadow-[#10B981]/10',
    icon: 'bg-[#10B981]/15 text-[#10B981]',
    value: 'text-[#10B981]',
    gradient: 'from-[#10B981]/12 via-[#111827] to-[#111827]',
  },
  amber: {
    border: 'border-l-[#F59E0B]',
    glow: 'shadow-[#F59E0B]/10',
    icon: 'bg-[#F59E0B]/15 text-[#F59E0B]',
    value: 'text-[#F59E0B]',
    gradient: 'from-[#F59E0B]/12 via-[#111827] to-[#111827]',
  },
  red: {
    border: 'border-l-[#EF4444]',
    glow: 'shadow-[#EF4444]/10',
    icon: 'bg-[#EF4444]/15 text-[#EF4444]',
    value: 'text-[#EF4444]',
    gradient: 'from-[#EF4444]/12 via-[#111827] to-[#111827]',
  },
  slate: {
    border: 'border-l-[#64748B]',
    glow: 'shadow-[#64748B]/10',
    icon: 'bg-white/10 text-[#94A3B8]',
    value: 'text-white',
    gradient: 'from-white/5 via-[#111827] to-[#111827]',
  },
}

const metaToneClass = {
  default: 'bg-white/10 text-[#94A3B8]',
  teal: 'bg-[#06B6D4]/15 text-[#06B6D4]',
  green: 'bg-[#10B981]/15 text-[#10B981]',
  amber: 'bg-[#F59E0B]/15 text-[#F59E0B]',
  red: 'bg-[#EF4444]/15 text-[#EF4444]',
  slate: 'bg-white/10 text-[#94A3B8]',
}

function CardPattern() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.35]"
      aria-hidden="true"
      style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)`,
        backgroundSize: '20px 20px',
      }}
    />
  )
}

export function ToggleSection({ id, title, subtitle, icon, badge, open, onToggle, children }) {
  const panelId = useId()

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="dashboard-glass overflow-hidden rounded-[20px] border border-white/[0.08] shadow-xl shadow-black/20"
    >
      <button
        type="button"
        id={`${id}-trigger`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="group flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition-all duration-300 hover:bg-white/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-inset sm:px-5"
      >
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#3B82F6]/20 to-[#06B6D4]/10 text-[#3B82F6] shadow-md shadow-[#3B82F6]/10 transition-transform duration-300 group-hover:scale-105 [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold leading-snug text-white">{title}</span>
          {subtitle && (
            <span className="mt-0.5 block text-xs font-medium text-[#94A3B8]">{subtitle}</span>
          )}
        </span>
        {badge != null && (
          <span className="hidden shrink-0 rounded-full border border-white/[0.08] bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium text-[#94A3B8] sm:inline-flex">
            {badge}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#64748B] transition-transform duration-300 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={`${id}-trigger`}
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/[0.06] px-5 py-5 sm:px-6 sm:py-6">
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function QuickStatPill({ label, value, tone = 'teal', icon: Icon }) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.teal
  const numericValue = typeof value === 'number' ? value : null

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`dashboard-kpi group relative overflow-hidden rounded-[20px] border border-white/[0.08] border-l-4 ${styles.border} bg-gradient-to-br ${styles.gradient} p-5 shadow-lg ${styles.glow} transition-shadow duration-300 hover:shadow-2xl`}
    >
      <CardPattern />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-[#94A3B8]">{label}</p>
          <p className={`mt-2 text-[34px] font-bold leading-none ${styles.value}`}>
            {numericValue != null ? <AnimatedNumber value={numericValue} /> : value}
          </p>
        </div>
        {Icon && (
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${styles.icon} shadow-inner transition-transform duration-300 group-hover:scale-110`}
          >
            <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </span>
        )}
      </div>
    </motion.div>
  )
}

export function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0

  return (
    <div className="rounded-[18px] border border-white/[0.08] bg-[#111827]/60 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] font-medium text-[#94A3B8]">{label}</span>
        <span className="text-[15px] font-semibold tabular-nums text-[#3B82F6]">
          <AnimatedNumber value={pct} />%
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#06B6D4]"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
      <p className="mt-3 text-[13px] text-[#64748B]">
        <AnimatedNumber value={value} /> of <AnimatedNumber value={max} /> beds occupied
      </p>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[120px] animate-pulse rounded-[20px] border border-white/[0.06] bg-[#111827]/80"
          />
        ))}
      </div>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[72px] animate-pulse rounded-[20px] border border-white/[0.06] bg-[#111827]/80"
        />
      ))}
    </div>
  )
}

export function DetailList({ items, loading, error, emptyLabel = 'No records found.' }) {
  if (loading) {
    return (
      <div className="space-y-2 py-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-[14px] border border-white/[0.04] bg-white/[0.04]"
          />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="rounded-[14px] border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-[13px] text-[#FCA5A5]">
        {error}
      </p>
    )
  }

  if (!items?.length) {
    return (
      <p className="rounded-[14px] border border-dashed border-white/[0.1] px-4 py-6 text-center text-[13px] text-[#64748B]">
        {emptyLabel}
      </p>
    )
  }

  return (
    <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
      {items.map((item, index) => (
        <motion.li
          key={item.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03, duration: 0.25 }}
          className="flex items-start justify-between gap-3 rounded-[14px] border border-white/[0.06] bg-[#0B1220]/50 px-4 py-3 transition-colors duration-200 hover:border-white/[0.12] hover:bg-white/[0.03]"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-medium text-white">{item.primary}</p>
            {item.secondary && (
              <p className="mt-0.5 truncate text-[13px] text-[#64748B]">{item.secondary}</p>
            )}
          </div>
          {item.meta && (
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${metaToneClass[item.tone] || metaToneClass.default}`}
            >
              {item.meta}
            </span>
          )}
        </motion.li>
      ))}
    </ul>
  )
}

export function StatDetailToggle({
  label,
  value,
  tone = 'default',
  hint,
  listOpen,
  onListToggle,
  showListToggle,
  listLabel,
  icon: Icon,
  children,
}) {
  const styles = TONE_STYLES[tone] || TONE_STYLES.default
  const numericValue = typeof value === 'number' ? value : null

  return (
    <div
      className={`dashboard-stat-card group relative overflow-hidden rounded-[18px] border border-white/[0.08] border-l-4 ${styles.border} bg-gradient-to-br ${styles.gradient} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl ${styles.glow}`}
    >
      <CardPattern />
      <div className="relative flex items-center gap-3 px-4 py-4 sm:px-5">
        {Icon && (
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${styles.icon} transition-transform duration-300 group-hover:scale-105`}
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-[#94A3B8]">{label}</p>
          {hint && <p className="mt-0.5 text-[13px] text-[#64748B]">{hint}</p>}
        </div>
        <p className={`text-[34px] font-bold leading-none ${styles.value}`}>
          {numericValue != null ? <AnimatedNumber value={numericValue} /> : value}
        </p>
        {showListToggle && (
          <button
            type="button"
            onClick={onListToggle}
            aria-expanded={listOpen}
            className="dashboard-btn-ghost shrink-0"
          >
            {listOpen ? 'Hide' : 'View all'}
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-300 ${listOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        )}
      </div>
      {showListToggle && (
        <div
          className={`relative grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${listOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className="overflow-hidden">
            <div className="border-t border-white/[0.06] px-4 pb-4 pt-3 sm:px-5">
              {listLabel && (
                <p className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-[#64748B]">
                  {listLabel}
                </p>
              )}
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* Kept for backward compatibility if used elsewhere */
export function StatRow(props) {
  return <StatDetailToggle {...props} showListToggle={false} />
}
