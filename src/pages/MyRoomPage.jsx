import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../utils/api'
import { Card, ErrorBlock, LoadingBlock, PageHeader, StatusBadge } from '../components/ui/Page'

export default function MyRoomPage() {
  const [allocation, setAllocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setAllocation(await apiGet('/api/allocations/me'))
    } catch (err) {
      setError(err.message || 'No room allocation found')
      setAllocation(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <PageHeader title="My Room" subtitle="Your current hostel allocation." />

      {loading && <LoadingBlock />}
      {error && !allocation && <ErrorBlock message={error} onRetry={load} />}

      {!loading && allocation && (
        <Card className="max-w-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Room {allocation.roomNumber}
            </h2>
            <StatusBadge tone={allocation.active ? 'green' : 'slate'}>
              {allocation.active ? 'Active' : 'Inactive'}
            </StatusBadge>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2 dark:border-slate-800">
              <dt className="text-slate-500">Bed</dt>
              <dd className="font-medium">{allocation.bedLabel}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2 dark:border-slate-800">
              <dt className="text-slate-500">Student ID</dt>
              <dd className="font-medium">{allocation.studentCode || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-2 dark:border-slate-800">
              <dt className="text-slate-500">Allocated at</dt>
              <dd className="font-medium">
                {allocation.allocatedAt ? new Date(allocation.allocatedAt).toLocaleString() : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Allocated by</dt>
              <dd className="font-medium">{allocation.allocatedByName || '—'}</dd>
            </div>
          </dl>
        </Card>
      )}
    </div>
  )
}
