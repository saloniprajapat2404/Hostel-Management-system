import { Bell, GraduationCap } from 'lucide-react'
import { motion } from 'framer-motion'
import AnimatedNumber from '../AnimatedNumber'

function MiniStatCard({ label, value, tone, icon: Icon }) {
  const tones = {
    teal: {
      border: 'border-l-[#06B6D4]',
      icon: 'bg-[#06B6D4]/15 text-[#06B6D4]',
      value: 'text-[#06B6D4]',
    },
    slate: {
      border: 'border-l-[#64748B]',
      icon: 'bg-slate-500/10 text-[var(--dash-muted)]',
      value: 'text-[var(--dash-text)]',
    },
  }
  const styles = tones[tone] || tones.teal

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`rounded-[18px] border border-l-4 ${styles.border} p-4 shadow-md`}
      style={{ borderColor: 'var(--dash-border)', background: 'color-mix(in srgb, var(--dash-surface) 80%, transparent)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-medium text-[var(--dash-muted)]">{label}</p>
          <p className={`mt-1 text-[28px] font-bold leading-none ${styles.value}`}>
            <AnimatedNumber value={Number(value || 0)} />
          </p>
        </div>
        {Icon && (
          <span className={`flex h-10 w-10 items-center justify-center rounded-[12px] ${styles.icon}`}>
            <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </span>
        )}
      </div>
    </motion.div>
  )
}

export default function WardenMiniStats({ students = 0, activeNotices = 0, loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-[88px] animate-pulse rounded-[18px] border"
            style={{ borderColor: 'var(--dash-border)', background: 'var(--dash-hover)' }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <MiniStatCard label="Students" value={students} tone="teal" icon={GraduationCap} />
      <MiniStatCard label="Active notices" value={activeNotices} tone="slate" icon={Bell} />
    </div>
  )
}
