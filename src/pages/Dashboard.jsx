import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Bell,
  Building2,
  DoorOpen,
  GraduationCap,
  IndianRupee,
  MessageSquare,
  MessageSquareWarning,
  Users,
} from 'lucide-react'
import { apiGet } from '../utils/api'
import { getSession } from '../utils/auth'
import DashboardStickyHeader from '../components/dashboard/enterprise/DashboardStickyHeader'
import DashboardHero from '../components/dashboard/enterprise/DashboardHero'
import CompactKpiGrid from '../components/dashboard/enterprise/CompactKpiGrid'
import QuickActionsBar from '../components/dashboard/enterprise/QuickActionsBar'
import RecentActivityTimeline from '../components/dashboard/enterprise/RecentActivityTimeline'
import DashboardCharts from '../components/dashboard/charts/DashboardCharts'
import { DashboardSkeleton } from '../components/ui/DashboardUi'

async function loadRecentActivity(role) {
  const items = []
  const canSeeAdmissions = role === 'ADMIN' || role === 'SUPER_ADMIN'

  if (canSeeAdmissions) {
    try {
      const admissions = (await apiGet('/api/admissions')) || []
      admissions.forEach((a) => {
        items.push({
          id: `adm-${a.id}`,
          type: 'admission',
          title: a.status === 'APPROVED' ? 'Admission approved' : 'New admission request',
          subtitle: a.studentName || a.email,
          at: a.reviewedAt || a.createdAt,
        })
      })
    } catch {
      /* optional */
    }
  }

  try {
    const complaints = (await apiGet('/api/complaints')) || []
    complaints.forEach((c) => {
      items.push({
        id: `cmp-${c.id}`,
        type: 'complaint',
        title:
          c.status === 'RESOLVED'
            ? 'Complaint resolved'
            : c.status === 'IN_PROGRESS'
              ? 'Complaint in progress'
              : 'Complaint registered',
        subtitle: c.title,
        at: c.createdAt,
      })
    })
  } catch {
    /* optional */
  }

  try {
    const notices = (await apiGet('/api/notices')) || []
    notices.forEach((n) => {
      items.push({
        id: `ntc-${n.id}`,
        type: 'notice',
        title: 'Notice published',
        subtitle: n.title,
        at: n.createdAt,
      })
    })
  } catch {
    /* optional */
  }

  if (role === 'STUDENT') {
    try {
      const fees = (await apiGet('/api/users/me/fees')) || []
      fees.forEach((fee) => {
        ;(fee.payments || []).forEach((p) => {
          items.push({
            id: `pay-${p.id}`,
            type: 'fee',
            title: 'Fee collected',
            subtitle: `₹${Number(p.amount || 0).toLocaleString('en-IN')} · ${p.feeType || fee.feeType}`,
            at: p.paidAt,
          })
        })
      })
    } catch {
      /* optional */
    }
  }

  return items
}

function buildKpis(stats, role, studentFeeBalance) {
  if (!stats) return []

  if (role === 'STUDENT') {
    return [
      {
        label: 'My room',
        value: stats.myRoomNumber || '—',
        tone: 'blue',
        icon: Building2,
      },
      {
        label: 'Fee balance',
        value: `₹${Number(studentFeeBalance || 0).toLocaleString('en-IN')}`,
        tone: 'amber',
        icon: IndianRupee,
      },
      {
        label: 'Open complaints',
        value: stats.myOpenComplaints ?? 0,
        tone: 'red',
        icon: MessageSquare,
      },
      {
        label: 'Active notice',
        value: stats.activeNotices ?? 0,
        tone: 'slate',
        icon: Bell,
      },
    ]
  }

  const kpis = []

  if (stats.students !== undefined) {
    kpis.push({ label: 'Students', value: stats.students, tone: 'blue', icon: GraduationCap })
  }
  if (stats.occupiedBeds !== undefined) {
    kpis.push({ label: 'Occupied beds', value: stats.occupiedBeds, tone: 'emerald', icon: Users })
  }
  if (stats.vacantBeds !== undefined) {
    kpis.push({ label: 'Vacant beds', value: stats.vacantBeds, tone: 'emerald', icon: DoorOpen })
  }
  if (stats.openComplaints !== undefined) {
    kpis.push({ label: 'Open complaints', value: stats.openComplaints, tone: 'red', icon: MessageSquareWarning })
  } else if (stats.myOpenComplaints !== undefined) {
    kpis.push({ label: 'Open complaints', value: stats.myOpenComplaints, tone: 'red', icon: MessageSquareWarning })
  }

  return kpis.slice(0, 4)
}

export default function Dashboard() {
  const user = getSession()
  const role = user?.role || 'STUDENT'
  const [stats, setStats] = useState(null)
  const [feeOverview, setFeeOverview] = useState(null)
  const [studentFees, setStudentFees] = useState([])
  const [activityItems, setActivityItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [feesLoading, setFeesLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setFeesLoading(true)
    setError('')
    setFeeOverview(null)
    setStudentFees([])
    setActivityItems([])
    try {
      const data = await apiGet('/api/dashboard/stats')
      setStats(data?.stats || {})

      if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
        try {
          setFeeOverview(await apiGet('/api/fees/overview'))
        } catch {
          setFeeOverview(null)
        }
      } else if (role === 'STUDENT') {
        try {
          setStudentFees((await apiGet('/api/users/me/fees')) || [])
        } catch {
          setStudentFees([])
        }
      }

      setActivityItems(await loadRecentActivity(role))
    } catch (err) {
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
      setFeesLoading(false)
    }
  }, [role])

  useEffect(() => {
    load()
  }, [load])

  const studentFeeBalance = useMemo(
    () => studentFees?.reduce((sum, f) => sum + Number(f.balanceAmount || 0), 0) ?? 0,
    [studentFees],
  )

  const kpis = useMemo(
    () => buildKpis(stats, role, studentFeeBalance),
    [stats, role, studentFeeBalance],
  )

  return (
    <div className="dashboard-premium -mx-4 -mt-2 min-h-[calc(100vh-5rem)] bg-[var(--dash-bg)] px-4 pb-10 md:-mx-6 md:px-6">
      <DashboardStickyHeader role={role} />

      {loading && <DashboardSkeleton />}
      {error && (
        <div className="dashboard-error" role="alert">
          <p className="text-[15px] text-[#FCA5A5]">{error}</p>
          <button type="button" onClick={load} className="dashboard-error-btn">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && stats && (
        <div className="dashboard-stack">
          <DashboardHero user={user} />

          <CompactKpiGrid pills={kpis} />

          <QuickActionsBar role={role} />

          <DashboardCharts
            role={role}
            stats={stats}
            feeOverview={feeOverview}
            studentFees={studentFees}
            chartsLoading={false}
            feesLoading={feesLoading}
          />

          <RecentActivityTimeline items={activityItems} role={role} />
        </div>
      )}
    </div>
  )
}
