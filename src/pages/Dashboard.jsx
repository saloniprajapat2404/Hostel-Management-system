import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { getSession, refreshSessionUser } from '../utils/auth'
import { buildRecentActivityFromData, buildStudentHistoryFromData } from '../utils/dashboardActivity'
import DashboardStickyHeader from '../components/dashboard/enterprise/DashboardStickyHeader'
import DashboardHero from '../components/dashboard/enterprise/DashboardHero'
import CompactKpiGrid from '../components/dashboard/enterprise/CompactKpiGrid'
import QuickActionsBar from '../components/dashboard/enterprise/QuickActionsBar'
import AddUserDashboardPanel from '../components/dashboard/enterprise/AddUserDashboardPanel'
import ExpensesDashboardPanel from '../components/dashboard/enterprise/ExpensesDashboardPanel'
import RecentActivityTimeline from '../components/dashboard/enterprise/RecentActivityTimeline'
import StudentHistoryPanel from '../components/dashboard/enterprise/StudentHistoryPanel'
import FeeCollectionPanel from '../components/dashboard/enterprise/FeeCollectionPanel'
import DashboardCharts from '../components/dashboard/charts/DashboardCharts'
import { KpiGridSkeleton } from '../components/ui/DashboardUi'

function buildKpis(stats, role, studentFeeBalance, feesLoading) {
  if (!stats) return []

  if (role === 'STUDENT') {
    const balanceLabel = feesLoading
      ? '…'
      : `₹${Number(studentFeeBalance || 0).toLocaleString('en-IN')}`

    return [
      { label: 'My room', value: stats.myRoomNumber || '—', tone: 'blue', icon: Building2, to: '/app/my-room' },
      { label: 'Fee balance', value: balanceLabel, tone: 'amber', icon: IndianRupee, to: '/app/my-fees' },
      { label: 'Open complaints', value: stats.myOpenComplaints ?? 0, tone: 'red', icon: MessageSquare, to: '/app/complaints' },
      { label: 'Active notice', value: stats.activeNotices ?? 0, tone: 'slate', icon: Bell, to: '/app/notices' },
    ]
  }

  const kpis = []
  if (stats.students !== undefined) {
    kpis.push({ label: 'Students', value: stats.students, tone: 'blue', icon: GraduationCap, to: '/app/users?role=STUDENT' })
  }
  if (stats.occupiedBeds !== undefined) {
    kpis.push({ label: 'Occupied beds', value: stats.occupiedBeds, tone: 'emerald', icon: Users, to: '/app/allocations?status=ACTIVE' })
  }
  if (stats.vacantBeds !== undefined) {
    kpis.push({ label: 'Vacant beds', value: stats.vacantBeds, tone: 'emerald', icon: DoorOpen, to: '/app/rooms?status=VACANT' })
  }
  if (stats.openComplaints !== undefined) {
    kpis.push({ label: 'Open complaints', value: stats.openComplaints, tone: 'red', icon: MessageSquareWarning, to: '/app/complaints?status=OPEN' })
  } else if (stats.myOpenComplaints !== undefined) {
    kpis.push({ label: 'Open complaints', value: stats.myOpenComplaints, tone: 'red', icon: MessageSquareWarning, to: '/app/complaints' })
  }

  return kpis.slice(0, 4)
}

export default function Dashboard() {
  const [user, setUser] = useState(() => getSession())
  const role = user?.role || getSession()?.role || 'STUDENT'
  const quickAccessRole = getSession()?.role || role
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const isStudent = role === 'STUDENT'

  const [stats, setStats] = useState(null)
  const [feeOverview, setFeeOverview] = useState(null)
  const [feeStudents, setFeeStudents] = useState([])
  const [studentFees, setStudentFees] = useState([])
  const [activityItems, setActivityItems] = useState([])
  const [studentHistory, setStudentHistory] = useState(null)

  const [statsLoading, setStatsLoading] = useState(true)
  const [feesLoading, setFeesLoading] = useState(false)
  const [activityLoading, setActivityLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [expensesOpen, setExpensesOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [error, setError] = useState('')
  const canManageFinance = quickAccessRole === 'ADMIN' || quickAccessRole === 'SUPER_ADMIN'

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    setError('')
    try {
      const data = await apiGet('/api/dashboard/stats')
      setStats(data?.stats || {})
    } catch (err) {
      setError(err.message || 'Failed to load dashboard')
      setStats(null)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const loadSecondaryData = useCallback(async () => {
    setFeesLoading(isAdmin || isStudent)
    setActivityLoading(true)
    setHistoryLoading(true)

    try {
      if (isAdmin) {
        const [overview, students, admissions, complaints, notices, allocations, attendance] =
          await Promise.all([
            apiGet('/api/fees/overview').catch(() => null),
            apiGet('/api/fees/students').catch(() => []),
            apiGet('/api/admissions').catch(() => []),
            apiGet('/api/complaints').catch(() => []),
            apiGet('/api/notices').catch(() => []),
            apiGet('/api/allocations').catch(() => []),
            apiGet('/api/attendance').catch(() => []),
          ])

        const studentList = students || []
        setFeeOverview(overview)
        setFeeStudents(studentList)

        const shared = {
          admissions,
          complaints,
          notices,
          allocations,
          attendance,
          studentFees: [],
          feeSummaries: studentList,
        }
        setActivityItems(buildRecentActivityFromData(shared, role, { limit: 30 }))
        setStudentHistory(
          buildStudentHistoryFromData(role, { limitPerCategory: 6, feeSummaries: studentList, ...shared }),
        )
      } else if (isStudent) {
        const [fees, complaints, notices, allocations] = await Promise.all([
          apiGet('/api/users/me/fees').catch(() => []),
          apiGet('/api/complaints').catch(() => []),
          apiGet('/api/notices').catch(() => []),
          apiGet('/api/allocations/me').then((a) => (a ? [a] : [])).catch(() => []),
        ])
        const feesList = fees || []
        setStudentFees(feesList)

        const shared = {
          admissions: [],
          complaints,
          notices,
          allocations,
          attendance: [],
          studentFees: feesList,
          feeSummaries: [],
        }
        setActivityItems(buildRecentActivityFromData(shared, role, { limit: 30 }))
        setStudentHistory(
          buildStudentHistoryFromData(role, {
            limitPerCategory: 6,
            userId: user?.id,
            userEmail: user?.email,
            studentFees: feesList,
            ...shared,
          }),
        )
      } else {
        const [complaints, notices, allocations] = await Promise.all([
          apiGet('/api/complaints').catch(() => []),
          apiGet('/api/notices').catch(() => []),
          apiGet('/api/allocations').catch(() => []),
        ])
        const shared = {
          admissions: [],
          complaints,
          notices,
          allocations,
          attendance: [],
          studentFees: [],
          feeSummaries: [],
        }
        setActivityItems(buildRecentActivityFromData(shared, role, { limit: 30 }))
        setStudentHistory(
          buildStudentHistoryFromData(role, {
            limitPerCategory: 6,
            userId: user?.id,
            ...shared,
          }),
        )
      }
    } catch {
      /* secondary sections are optional */
    } finally {
      setFeesLoading(false)
      setActivityLoading(false)
      setHistoryLoading(false)
    }
  }, [isAdmin, isStudent, role, user?.id, user?.email])

  useEffect(() => {
    loadStats()
    loadSecondaryData()
  }, [loadStats, loadSecondaryData])

  useEffect(() => {
    if (searchParams.get('panel') === 'expenses' && canManageFinance) {
      setExpensesOpen(true)
      setAddUserOpen(false)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, canManageFinance])

  useEffect(() => {
    let alive = true
    refreshSessionUser().then((fresh) => {
      if (alive && fresh) setUser(fresh)
    })
    const onSessionUpdated = (event) => {
      setUser(event.detail || getSession())
    }
    window.addEventListener('hms:session-updated', onSessionUpdated)
    return () => {
      alive = false
      window.removeEventListener('hms:session-updated', onSessionUpdated)
    }
  }, [])

  const studentFeeBalance = useMemo(
    () => studentFees?.reduce((sum, f) => sum + Number(f.balanceAmount || 0), 0) ?? 0,
    [studentFees],
  )

  const kpis = useMemo(
    () => buildKpis(stats, role, studentFeeBalance, feesLoading && isStudent),
    [stats, role, studentFeeBalance, feesLoading, isStudent],
  )

  return (
    <div className="dashboard-premium -mx-4 -mt-2 min-h-[calc(100vh-5rem)] bg-[var(--dash-bg)] px-4 pb-10 md:-mx-6 md:px-6">
      <DashboardStickyHeader role={role} />

      {error && (
        <div className="dashboard-error" role="alert">
          <p className="text-[15px] text-[#FCA5A5]">{error}</p>
          <button type="button" onClick={loadStats} className="dashboard-error-btn">
            Retry
          </button>
        </div>
      )}

      {!error && (
        <div className="dashboard-stack">
          <DashboardHero user={user} />

          {statsLoading && <KpiGridSkeleton />}

          {!statsLoading && stats && <CompactKpiGrid pills={kpis} />}

          <QuickActionsBar
            role={quickAccessRole}
            addUserOpen={addUserOpen}
            onAddUserToggle={() => {
              setAddUserOpen((open) => !open)
              setExpensesOpen(false)
            }}
            expensesOpen={expensesOpen}
            onExpensesToggle={() => {
              setExpensesOpen((open) => !open)
              setAddUserOpen(false)
            }}
          />
          {canManageFinance && (
            <AddUserDashboardPanel open={addUserOpen} onClose={() => setAddUserOpen(false)} />
          )}
          {canManageFinance && (
            <ExpensesDashboardPanel open={expensesOpen} onClose={() => setExpensesOpen(false)} />
          )}

          {!statsLoading && stats && (
            <>
              <DashboardCharts
                role={role}
                stats={stats}
                feeOverview={feeOverview}
                studentFees={studentFees}
                chartsLoading={false}
                feesLoading={feesLoading}
              />

              {isAdmin && <FeeCollectionPanel students={feeStudents} loading={feesLoading} />}
            </>
          )}

          <StudentHistoryPanel role={role} history={studentHistory} loading={historyLoading} />

          <RecentActivityTimeline items={activityItems} role={role} loading={activityLoading} />
        </div>
      )}
    </div>
  )
}
