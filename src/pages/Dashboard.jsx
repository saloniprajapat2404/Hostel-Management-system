import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
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
import { canAccessPath } from '../constants/screenPermissions'
import { useBranch } from '../context/BranchContext'
import { buildRecentActivityFromData, buildStudentHistoryFromData } from '../utils/dashboardActivity'
import DashboardStickyHeader from '../components/dashboard/enterprise/DashboardStickyHeader'
import DashboardHero from '../components/dashboard/enterprise/DashboardHero'
import CompactKpiGrid from '../components/dashboard/enterprise/CompactKpiGrid'
import QuickActionsBar from '../components/dashboard/enterprise/QuickActionsBar'
import RecentActivityTimeline from '../components/dashboard/enterprise/RecentActivityTimeline'
import StudentHistoryPanel from '../components/dashboard/enterprise/StudentHistoryPanel'
import FeeCollectionPanel from '../components/dashboard/enterprise/FeeCollectionPanel'
import DashboardCharts from '../components/dashboard/charts/DashboardCharts'
import { KpiGridSkeleton } from '../components/ui/DashboardUi'

function buildKpis(stats, role, studentFeeBalance, feesLoading, user) {
  if (!stats) return []

  if (role === 'STUDENT') {
    const balanceLabel = feesLoading
      ? '…'
      : `₹${Number(studentFeeBalance || 0).toLocaleString('en-IN')}`

    const pills = [
      { label: 'My room', value: stats.myRoomNumber || '—', tone: 'blue', icon: Building2, to: '/app/my-room' },
      { label: 'Fee balance', value: balanceLabel, tone: 'amber', icon: IndianRupee, to: '/app/my-fees' },
      { label: 'Open complaints', value: stats.myOpenComplaints ?? 0, tone: 'red', icon: MessageSquare, to: '/app/complaints' },
      { label: 'Active notice', value: stats.activeNotices ?? 0, tone: 'slate', icon: Bell, to: '/app/notices' },
    ]

    return pills.filter((pill) => !pill.to || canAccessPath(user, pill.to))
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

  return kpis.filter((kpi) => !kpi.to || canAccessPath(user, kpi.to)).slice(0, 4)
}

export default function Dashboard() {
  const { currentBranch } = useBranch()
  const [user, setUser] = useState(() => getSession())
  const role = user?.role || getSession()?.role || 'STUDENT'

  if (role === 'SUPER_ADMIN' && !currentBranch) {
    return <Navigate to="/superadmin" replace />
  }

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
  const [error, setError] = useState('')

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
    setFeesLoading(isAdmin || (isStudent && canAccessPath(user, '/app/my-fees')))
    setActivityLoading(true)
    setHistoryLoading(true)

    try {
      if (isAdmin) {
        const canFees = canAccessPath(user, '/app/fees')
        const canComplaints = canAccessPath(user, '/app/complaints')
        const canHostel = canAccessPath(user, '/app/admissions')
        const canAttendance = canAccessPath(user, '/app/attendance')

        const [overview, students, admissions, complaints, notices, allocations, attendance] =
          await Promise.all([
            canFees ? apiGet('/api/fees/overview').catch(() => null) : Promise.resolve(null),
            canFees ? apiGet('/api/fees/students').catch(() => []) : Promise.resolve([]),
            canHostel ? apiGet('/api/admissions').catch(() => []) : Promise.resolve([]),
            canComplaints ? apiGet('/api/complaints').catch(() => []) : Promise.resolve([]),
            canComplaints ? apiGet('/api/notices').catch(() => []) : Promise.resolve([]),
            canHostel ? apiGet('/api/allocations').catch(() => []) : Promise.resolve([]),
            canAttendance ? apiGet('/api/attendance').catch(() => []) : Promise.resolve([]),
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
        const canFees = canAccessPath(user, '/app/my-fees')
        const canComplaints = canAccessPath(user, '/app/complaints')
        const canNotices = canAccessPath(user, '/app/notices')

        const [fees, complaints, notices, allocations] = await Promise.all([
          canFees ? apiGet('/api/users/me/fees').catch(() => []) : Promise.resolve([]),
          canComplaints ? apiGet('/api/complaints').catch(() => []) : Promise.resolve([]),
          canNotices ? apiGet('/api/notices').catch(() => []) : Promise.resolve([]),
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
        const canComplaints = canAccessPath(user, '/app/complaints')
        const canHostel = canAccessPath(user, '/app/admissions')

        const [complaints, notices, allocations] = await Promise.all([
          canComplaints ? apiGet('/api/complaints').catch(() => []) : Promise.resolve([]),
          canComplaints ? apiGet('/api/notices').catch(() => []) : Promise.resolve([]),
          canHostel ? apiGet('/api/allocations').catch(() => []) : Promise.resolve([]),
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
  }, [isAdmin, isStudent, role, user])

  useEffect(() => {
    loadStats()
    loadSecondaryData()
  }, [loadStats, loadSecondaryData])

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
    () => buildKpis(stats, role, studentFeeBalance, feesLoading && isStudent, user),
    [stats, role, studentFeeBalance, feesLoading, isStudent, user],
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

          <QuickActionsBar user={user} />

          {!statsLoading && stats && (
            <>
              <DashboardCharts
                role={role}
                user={user}
                stats={stats}
                feeOverview={feeOverview}
                studentFees={studentFees}
                chartsLoading={false}
                feesLoading={feesLoading}
              />

              {isAdmin && canAccessPath(user, '/app/fees') && (
                <FeeCollectionPanel students={feeStudents} loading={feesLoading} />
              )}
            </>
          )}

          <StudentHistoryPanel role={role} history={studentHistory} loading={historyLoading} user={user} />

          <RecentActivityTimeline items={activityItems} role={role} loading={activityLoading} />
        </div>
      )}
    </div>
  )
}
