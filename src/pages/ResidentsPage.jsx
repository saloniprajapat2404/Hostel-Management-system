import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../utils/api'
import ListToolbar, { useListControls } from '../components/ListToolbar'
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeader,
  StatusBadge,
  Table,
} from '../components/ui/Page'

export default function ResidentsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [students, allocations] = await Promise.all([
        apiGet('/api/users?role=STUDENT'),
        apiGet('/api/allocations'),
      ])
      const active = (allocations || []).filter((a) => a.active)
      const byStudent = new Map(active.map((a) => [String(a.studentId), a]))
      setRows(
        (students || [])
          .map((s) => ({
            ...s,
            allocation: byStudent.get(String(s.id)) || null,
          }))
          .filter((s) => s.allocation),
      )
    } catch (err) {
      setError(err.message || 'Failed to load residents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const { search, setSearch, sortKey, setSortKey, sortDir, setSortDir, filtered } = useListControls(rows, {
    searchKeys: ['fullName', 'email', 'studentId', 'phone'],
    initialSortKey: 'fullName',
    getSortValue: (item, key) => {
      if (key === 'room') return item.allocation?.roomNumber || ''
      return item[key]
    },
  })

  return (
    <div>
      <PageHeader
        title="Residents"
        subtitle={`${rows.length} students currently allocated in the hostel.`}
      />

      {error && (
        <div className="mb-4">
          <ErrorBlock message={error} onRetry={load} />
        </div>
      )}
      {loading && <LoadingBlock />}

      {!loading && (
        <>
          <ListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search residents…"
            sortOptions={[
              { value: 'fullName', label: 'Sort by name' },
              { value: 'studentId', label: 'Sort by student ID' },
              { value: 'room', label: 'Sort by room' },
            ]}
            sortKey={sortKey}
            sortDir={sortDir}
            onSortKeyChange={setSortKey}
            onSortDirChange={setSortDir}
          />

          {filtered.length === 0 ? (
            <EmptyBlock message="No residents match your filters." />
          ) : (
            <Table headers={['Resident', 'Student ID', 'Room', 'Bed', 'Status', '']}>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{r.fullName}</p>
                    <p className="text-xs text-slate-500">{r.email}</p>
                  </td>
                  <td className="px-4 py-3">{r.studentId || '—'}</td>
                  <td className="px-4 py-3">{r.allocation?.roomNumber || '—'}</td>
                  <td className="px-4 py-3">{r.allocation?.bedLabel || '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone="green">Resident</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/app/students/${r.id}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      History
                    </Link>
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
