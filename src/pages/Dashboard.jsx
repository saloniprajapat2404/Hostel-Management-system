import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../utils/api'
import { getSession } from '../utils/auth'
import { Card, ErrorBlock, LoadingBlock, PageHeader } from '../components/ui/Page'

const LABELS = {
  totalRooms: 'Total rooms',
  totalBeds: 'Total beds',
  occupiedBeds: 'Occupied beds',
  vacantBeds: 'Vacant beds',
  activeAllocations: 'Active allocations',
  activeNotices: 'Active notices',
  students: 'Students',
  wardens: 'Wardens',
  admins: 'Admins',
  pendingAdmissions: 'Pending admissions',
  openComplaints: 'Open complaints',
  inProgressComplaints: 'In-progress complaints',
  myOpenComplaints: 'My open complaints',
  hasAllocation: 'Room allocated',
}

function formatValue(key, value) {
  if (key === 'hasAllocation') return value ? 'Yes' : 'No'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return value
}

export default function Dashboard() {
  const user = getSession()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiGet('/api/dashboard/stats')
      setStats(data?.stats || {})
    } catch (err) {
      setError(err.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const cards = Object.entries(stats || {}).filter(([key]) => key !== 'role')

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${user?.fullName || user?.email || 'User'}.`}
      />

      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(([key, value]) => (
            <Card key={key}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {LABELS[key] || key}
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                {formatValue(key, value)}
              </p>
            </Card>
          ))}
          {cards.length === 0 && (
            <Card>
              <p className="text-sm text-slate-500">No stats available.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
