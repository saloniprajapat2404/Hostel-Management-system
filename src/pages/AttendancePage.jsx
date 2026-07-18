import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost } from '../utils/api'
import { getSession } from '../utils/auth'
import { matchesSearch, sortRows, toggleSort } from '../utils/tableHelpers'
import {
  ActionButton,
  Card,
  EmptyBlock,
  ErrorBlock,
  Field,
  FilterSelect,
  fieldClass,
  LoadingBlock,
  PageHeader,
  SearchInput,
  StatusBadge,
  Table,
  TableToolbar,
} from '../components/ui/Page'

export default function AttendancePage() {
  const session = getSession()
  const canRecord = session?.role === 'WARDEN' || session?.role === 'ADMIN' || session?.role === 'SUPER_ADMIN'
  const [items, setItems] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [type, setType] = useState('CHECK_IN')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('')
  const [sortKey, setSortKey] = useState('timestamp')
  const [sortDir, setSortDir] = useState('desc')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [attendance, allocations] = await Promise.all([
        apiGet('/api/attendance'),
        apiGet('/api/allocations'),
      ])
      setItems(attendance || [])
      const map = new Map()
      for (const a of allocations || []) {
        if (a.active && !map.has(a.studentId)) {
          map.set(a.studentId, {
            id: a.studentId,
            name: a.studentName,
            code: a.studentCode,
          })
        }
      }
      setStudents([...map.values()])
    } catch (err) {
      setError(err.message || 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const studentOptions = useMemo(() => students, [students])

  const displayedItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const matchesType = typeFilter === 'ALL' || item.type === typeFilter
      const matchesDate =
        !dateFilter ||
        (item.timestamp && item.timestamp.slice(0, 10) === dateFilter)
      const matchesQuery = matchesSearch(search, [item.studentName, item.studentCode, item.notes])
      return matchesType && matchesDate && matchesQuery
    })
    return sortRows(filtered, sortKey, sortDir, (item) => item[sortKey])
  }, [items, search, typeFilter, dateFilter, sortKey, sortDir])

  const handleSort = (key) => {
    const next = toggleSort(sortKey, sortDir, key)
    setSortKey(next.sortKey)
    setSortDir(next.sortDir)
  }

  const columns = [
    { key: 'studentName', label: 'Student' },
    { key: 'studentCode', label: 'Code' },
    { key: 'type', label: 'Type' },
    { key: 'timestamp', label: 'Time' },
    { key: 'recordedByName', label: 'Recorded by' },
    { key: 'notes', label: 'Notes' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiPost('/api/attendance', {
        studentId,
        type,
        notes: notes || null,
      })
      setShowForm(false)
      setStudentId('')
      setType('CHECK_IN')
      setNotes('')
      await load()
    } catch (err) {
      setError(err.message || 'Record failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Student check-in and check-out records."
        actions={
          canRecord ? (
            <ActionButton onClick={() => setShowForm(true)}>Record attendance</ActionButton>
          ) : null
        }
      />

      {error && <div className="mb-4"><ErrorBlock message={error} onRetry={load} /></div>}
      {loading && <LoadingBlock />}

      {showForm && canRecord && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">Check-in / Check-out</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Student">
              <select className={fieldClass} required value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                <option value="">Select student</option>
                {studentOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code || s.id})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Type">
              <select className={fieldClass} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="CHECK_IN">CHECK_IN</option>
                <option value="CHECK_OUT">CHECK_OUT</option>
              </select>
            </Field>
            <Field label="Notes">
              <input className={fieldClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <div className="flex gap-2 sm:col-span-2">
              <ActionButton type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</ActionButton>
              <ActionButton variant="ghost" onClick={() => setShowForm(false)}>Cancel</ActionButton>
            </div>
          </form>
        </Card>
      )}

      {!loading && items.length === 0 && <EmptyBlock message="No attendance records." />}

      {!loading && items.length > 0 && (
        <>
          <TableToolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search student, code, notes…" />
            <FilterSelect value={typeFilter} onChange={setTypeFilter}>
              <option value="ALL">All types</option>
              <option value="CHECK_IN">Check in</option>
              <option value="CHECK_OUT">Check out</option>
            </FilterSelect>
            <input
              type="date"
              className={`${fieldClass} sm:w-auto`}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by date"
            />
          </TableToolbar>

          {displayedItems.length === 0 ? (
            <EmptyBlock message="No attendance records match your filters." />
          ) : (
            <Table sortableHeaders={columns} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>
              {displayedItems.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-3 font-medium">{a.studentName}</td>
              <td className="px-4 py-3">{a.studentCode || '—'}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={a.type === 'CHECK_IN' ? 'green' : 'amber'}>{a.type}</StatusBadge>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {a.timestamp ? new Date(a.timestamp).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3">{a.recordedByName || '—'}</td>
              <td className="px-4 py-3">{a.notes || '—'}</td>
            </tr>
              ))}
            </Table>
          )}
        </>
      )}
    </div>
  )
}
