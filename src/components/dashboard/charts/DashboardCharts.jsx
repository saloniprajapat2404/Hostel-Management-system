import ComplaintsBarChart from './ComplaintsBarChart'
import FeesStackedBar from './FeesStackedBar'
import OccupancyDonut from './OccupancyDonut'
import StudentFeeDonut from './StudentFeeDonut'
import UserCountsBarChart from './UserCountsBarChart'

export default function DashboardCharts({
  role,
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
    return (
      <section>
        <h3 className="dashboard-section-label">Analytics</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <OccupancyDonut
            occupied={stats?.occupiedBeds}
            vacant={stats?.vacantBeds}
            loading={chartsLoading}
          />
          <ComplaintsBarChart
            open={stats?.openComplaints}
            inProgress={stats?.inProgressComplaints}
            resolved={stats?.resolvedComplaints}
            loading={chartsLoading}
          />
        </div>
      </section>
    )
  }

  if (isAdmin) {
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
          <OccupancyDonut
            occupied={stats?.occupiedBeds}
            vacant={stats?.vacantBeds}
            loading={chartsLoading}
          />
          <FeesStackedBar overview={feeOverview} loading={feesLoading} />
          <ComplaintsBarChart
            open={stats?.openComplaints}
            inProgress={stats?.inProgressComplaints}
            resolved={stats?.resolvedComplaints}
            loading={chartsLoading}
          />
        </div>
      </section>
    )
  }

  return null
}
