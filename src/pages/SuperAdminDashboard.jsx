import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Building2,
  DoorClosed,
  DoorOpen,
  IndianRupee,
  LayoutGrid,
  LogOut,
  MapPin,
  Percent,
  Settings2,
  Sparkles,
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { apiGet } from '../utils/api'
import { clearSession } from '../utils/auth'
import { useBranch } from '../context/BranchContext'
import { useHostelConfig } from '../context/HostelConfigContext'
import { useDarkMode } from '../hooks/useDarkMode'
import HostelLogo from '../components/HostelLogo'
import DarkModeToggle from '../components/DarkModeToggle'
import BranchSelector from '../components/layout/BranchSelector'
import { ErrorBlock } from '../components/ui/Page'
import { QuickStatPill } from '../components/ui/DashboardUi'

function formatCurrency(value) {
  const num = Number(value || 0)
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num)
}

function occupancyTone(percent) {
  if (percent >= 75) return 'bg-emerald-500'
  if (percent >= 40) return 'bg-amber-500'
  return 'bg-sky-500'
}

function BranchStat({ icon: Icon, label, value, tone = 'default' }) {
  const tones = {
    default: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
    teal: 'bg-[#06B6D4]/15 text-[#06B6D4]',
    green: 'bg-[#10B981]/15 text-[#10B981]',
    amber: 'bg-[#F59E0B]/15 text-[#F59E0B]',
    blue: 'bg-[#3B82F6]/15 text-[#3B82F6]',
  }

  return (
    <div className="rounded-2xl border border-[var(--dash-border-subtle)] bg-[var(--dash-surface-muted)]/80 p-4">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--dash-muted)]">{label}</p>
          <p className="mt-0.5 truncate text-lg font-bold leading-tight text-[var(--dash-text)]">{value}</p>
        </div>
      </div>
    </div>
  )
}

function BranchCard({ branch, index, onOpen }) {
  const occupancy = Number(branch.occupancyPercent || 0)

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      className="dashboard-glass group flex h-full flex-col overflow-hidden rounded-[24px] border shadow-lg transition-shadow duration-300 hover:shadow-2xl"
      style={{ borderColor: 'var(--dash-border)', boxShadow: '0 16px 40px var(--dash-shadow)' }}
    >
      <div className="relative border-b border-[var(--dash-border-subtle)] px-6 pb-5 pt-6">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          aria-hidden="true"
          style={{
            background:
              'radial-gradient(circle at top right, rgba(20,184,166,0.14), transparent 55%), radial-gradient(circle at bottom left, rgba(59,130,246,0.08), transparent 50%)',
          }}
        />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-[#3B82F6]/10 text-primary shadow-inner ring-1 ring-primary/10 dark:from-primary/25 dark:to-[#3B82F6]/15 dark:text-primary-light">
              <Building2 className="h-7 w-7" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 pt-0.5">
              <h3 className="text-lg font-bold leading-snug tracking-tight text-[var(--dash-text)]">
                {branch.name}
              </h3>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--dash-muted)]">
                <MapPin className="h-4 w-4 shrink-0 text-primary/80" />
                <span className="truncate">{branch.city}</span>
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold tracking-wide text-primary dark:border-primary/30 dark:bg-primary/20 dark:text-primary-light">
            {branch.code}
          </span>
        </div>

        <div className="relative mt-5">
          <div className="mb-2 flex items-center justify-between text-xs font-medium">
            <span className="flex items-center gap-1 text-[var(--dash-muted)]">
              <Percent className="h-3.5 w-3.5" />
              Occupancy
            </span>
            <span className="text-[var(--dash-text)]">{occupancy}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(occupancy, 100)}%` }}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full ${occupancyTone(occupancy)}`}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-5 px-6 py-5">
        <div className="grid grid-cols-2 gap-4">
          <BranchStat icon={Users} label="Students" value={branch.studentCount ?? 0} tone="green" />
          <BranchStat icon={DoorOpen} label="Rooms" value={branch.roomCount ?? 0} tone="blue" />
          <BranchStat icon={IndianRupee} label="Revenue" value={formatCurrency(branch.revenue)} tone="amber" />
          <BranchStat
            icon={Percent}
            label="Occupancy"
            value={`${occupancy}%`}
            tone="teal"
          />
        </div>

        <button
          type="button"
          onClick={() => onOpen(branch.slug)}
          className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all duration-200 hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          Open Branch
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>
    </motion.article>
  )
}

function KpiSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="h-[108px] animate-pulse rounded-[20px] border"
          style={{
            borderColor: 'var(--dash-border)',
            background: 'color-mix(in srgb, var(--dash-surface) 80%, transparent)',
          }}
        />
      ))}
    </div>
  )
}

function BranchGridSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-[360px] animate-pulse rounded-[24px] border"
          style={{
            borderColor: 'var(--dash-border)',
            background: 'color-mix(in srgb, var(--dash-surface) 80%, transparent)',
          }}
        />
      ))}
    </div>
  )
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate()
  const { clearBranch } = useBranch()
  const { dark, toggle } = useDarkMode()
  const { hostelName, systemName } = useHostelConfig()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    clearBranch()
  }, [clearBranch])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await apiGet('/api/superadmin/dashboard')
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const openBranch = (slug) => {
    navigate(`/superadmin/branch/${slug}`)
  }

  const handleSignOut = () => {
    clearSession()
    navigate('/')
  }

  return (
    <div className="min-h-screen text-[var(--dash-text)]" style={{ background: 'var(--dash-bg)' }}>
      <header className="sticky top-0 z-30 border-b border-[var(--dash-border-subtle)] bg-[var(--dash-glass-from)]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <HostelLogo size="sm" alt={hostelName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[var(--dash-text)]">{hostelName}</p>
              <p className="truncate text-xs text-[var(--dash-muted)]">{systemName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <BranchSelector />
            <DarkModeToggle dark={dark} onToggle={toggle} label="Dark mode" />
            <button
              type="button"
              onClick={handleSignOut}
              className="dashboard-icon-btn"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="dashboard-stack">
          <section className="dashboard-glass overflow-hidden rounded-[28px] border px-6 py-7 sm:px-8 sm:py-8 lg:px-10 lg:py-9" style={{ borderColor: 'var(--dash-border)' }}>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary dark:text-primary-light">
                  <Sparkles className="h-3.5 w-3.5" />
                  Super Admin
                </span>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--dash-text)] sm:text-3xl lg:text-[2rem]">
                    All Branches Overview
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--dash-muted)] sm:text-[15px]">
                    Monitor every Takshak Hostel location, compare performance, and open any branch dashboard in one click.
                  </p>
                </div>
              </div>
              <Link
                to="/superadmin/branches"
                className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-2xl border border-[var(--dash-border)] bg-[var(--dash-surface)] px-5 py-3.5 text-sm font-semibold text-[var(--dash-text)] shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary lg:self-center"
              >
                <Settings2 className="h-4 w-4" />
                Manage Branches
              </Link>
            </div>
          </section>

          {loading && (
            <>
              <KpiSkeleton />
              <BranchGridSkeleton />
            </>
          )}

          {error && <ErrorBlock message={error} />}

          {!loading && !error && data && (
            <>
              <section>
                <div className="mb-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="dashboard-section-label">Network Summary</p>
                    <h2 className="text-xl font-bold tracking-tight text-[var(--dash-text)]">Key metrics</h2>
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
                  <QuickStatPill label="Total Branches" value={data.totalBranches} icon={Building2} tone="teal" />
                  <QuickStatPill label="Total Students" value={data.totalStudents} icon={Users} tone="green" />
                  <QuickStatPill
                    label="Total Revenue"
                    value={formatCurrency(data.totalRevenue)}
                    icon={IndianRupee}
                    tone="amber"
                  />
                  <QuickStatPill
                    label="Occupied Rooms"
                    value={data.totalOccupiedRooms}
                    icon={DoorClosed}
                    tone="red"
                  />
                  <QuickStatPill
                    label="Available Rooms"
                    value={data.totalAvailableRooms}
                    icon={DoorOpen}
                    tone="default"
                  />
                </div>
              </section>

              <section>
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="dashboard-section-label">Branch Overview</p>
                    <h2 className="text-xl font-bold tracking-tight text-[var(--dash-text)]">
                      Hostel locations
                    </h2>
                    <p className="mt-1 text-sm text-[var(--dash-muted)]">
                      Select a branch to manage students, rooms, fees, and more.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--dash-border-subtle)] bg-[var(--dash-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--dash-muted)]">
                    <LayoutGrid className="h-3.5 w-3.5" />
                    {data.branches?.length || 0} branches
                  </span>
                </div>

                {(!data.branches || data.branches.length === 0) ? (
                  <div
                    className="rounded-[24px] border px-6 py-12 text-center"
                    style={{ borderColor: 'var(--dash-border)', background: 'var(--dash-surface)' }}
                  >
                    <Building2 className="mx-auto h-10 w-10 text-[var(--dash-muted)]" />
                    <p className="mt-4 text-sm text-[var(--dash-muted)]">No active branches found.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {data.branches.map((branch, index) => (
                      <BranchCard key={branch.id} branch={branch} index={index} onOpen={openBranch} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
