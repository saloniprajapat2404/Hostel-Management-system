import ComplaintsBarChart from './ComplaintsBarChart'
import FeesStackedBar from './FeesStackedBar'
import OccupancyDonut from './OccupancyDonut'
import StudentFeeDonut from './StudentFeeDonut'
import UserCountsBarChart from './UserCountsBarChart'

import { canAccessPath } from '../../../constants/screenPermissions'

export default function DashboardCharts({
  role,
  user,
  stats,
  feeOverview,
  studentFees,
  chartsLoading = false,
  feesLoading = false,
}) {
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'
  const isSuperAdmin = role === 'SUPER_ADMIN'
  const isWarden = role === 'WARDEN'
  const isStudent = role === 'STUDENT'

  if (isStudent) {
    if (!canAccessPath(user, '/app/my-fees')) {
      return null
    }

    const paid = studentFees?.reduce((sum, f) => sum + Number(f.paidAmount || 0), 0) ?? 0
    const balance = studentFees?.reduce((sum, f) => sum + Number(f.balanceAmount || 0), 0) ?? 0

    return (
      <section>
        <h3 className="dashboard-section-label">Analytics</h3>
        <div className="max-w-sm">
          <StudentFeeDonut paid={paid} balance={balance} loading={feesLoading} />
        </div>
      </section>
    )
  }

  if (isWarden) {
    const canComplaints = canAccessPath(user, '/app/complaints')
    const canReports = canAccessPath(user, '/app/occupancy')

    if (!canReports && !canComplaints) return null

    return (
      <section>
        <h3 className="dashboard-section-label">Analytics</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {canReports && (
            <OccupancyDonut
              occupied={stats?.occupiedBeds}
              vacant={stats?.vacantBeds}
              loading={chartsLoading}
            />
          )}
          {canComplaints && (
            <ComplaintsBarChart
              open={stats?.openComplaints}
              inProgress={stats?.inProgressComplaints}
              resolved={stats?.resolvedComplaints}
              loading={chartsLoading}
            />
          )}
        </div>
      </section>
    )
  }

  if (isAdmin) {
    const canFees = canAccessPath(user, '/app/fees')
    const canComplaints = canAccessPath(user, '/app/complaints')
    const canReports = canAccessPath(user, '/app/occupancy')

    if (!canReports && !canFees && !canComplaints && !isSuperAdmin) return null

    return (
      <section>
        <h3 className="dashboard-section-label">Analytics</h3>
        <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${isSuperAdmin ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}>
          {isSuperAdmin && (
            <UserCountsBarChart
              students={stats?.students ?? 0}
              wardens={stats?.wardens ?? 0}
              admins={stats?.admins ?? 0}
              loading={chartsLoading}
            />
          )}
          {canReports && (
            <OccupancyDonut
              occupied={stats?.occupiedBeds}
              vacant={stats?.vacantBeds}
              loading={chartsLoading}
            />
          )}
          {canFees && <FeesStackedBar overview={feeOverview} loading={feesLoading} />}
          {canComplaints && (
            <ComplaintsBarChart
              open={stats?.openComplaints}
              inProgress={stats?.inProgressComplaints}
              resolved={stats?.resolvedComplaints}
              loading={chartsLoading}
            />
          )}
        </div>
      </section>
    )
  }

  return null
}
