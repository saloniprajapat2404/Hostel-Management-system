import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../utils/api'
import {
  Card,
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  StatusBadge,
  Table,
} from '../components/ui/Page'

export default function OccupancyPage() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setReport(await apiGet('/api/reports/occupancy'))
    } catch (err) {
      setError(err.message || 'Failed to load occupancy report')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <PageHeader title="Occupancy" subtitle="Live hostel occupancy report." />

      {error && <div className="mb-4"><ErrorBlock message={error} onRetry={load} /></div>}
      {loading && <LoadingBlock />}

      {!loading && report && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ['Total rooms', report.totalRooms],
              ['Total beds', report.totalBeds],
              ['Occupied', report.occupiedBeds],
              ['Vacant', report.vacantBeds],
              ['Occupancy %', `${Number(report.occupancyPercent || 0).toFixed(1)}%`],
            ].map(([label, value]) => (
              <Card key={label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
              </Card>
            ))}
          </div>

          {(report.rooms || []).length === 0 ? (
            <EmptyBlock />
          ) : (
            <Table headers={['Room', 'Floor', 'Capacity', 'Occupied', 'Vacant', 'Status']}>
              {report.rooms.map((room) => (
                <tr key={room.id}>
                  <td className="px-4 py-3 font-medium">{room.roomNumber}</td>
                  <td className="px-4 py-3">{room.floor}</td>
                  <td className="px-4 py-3">{room.capacity}</td>
                  <td className="px-4 py-3">{room.occupiedCount}</td>
                  <td className="px-4 py-3">{room.vacantCount}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={room.vacantCount > 0 ? 'teal' : 'amber'}>
                      {room.vacantCount > 0 ? 'Has vacancy' : 'Full'}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </>
      )}
    </div>
  )
}
