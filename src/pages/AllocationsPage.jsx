import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiDelete, apiGet, apiPost } from '../utils/api'
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

export default function AllocationsPage() {
  const session = getSession()
  const canManage = session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN'
  const [allocations, setAllocations] = useState([])
  const [students, setStudents] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [bedId, setBedId] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortKey, setSortKey] = useState('allocatedAt')
  const [sortDir, setSortDir] = useState('desc')

  const vacantBeds = useMemo(() => {
    const beds = []
    for (const room of rooms) {
      if (room.active === false) continue
      for (const bed of room.beds || []) {
        if (!bed.occupied) {
          beds.push({
            id: bed.id,
            label: `${room.roomNumber} · ${bed.bedLabel}`,
          })
        }
      }
    }
    return beds
  }, [rooms])

  const allocatedStudentIds = useMemo(
    () => new Set((allocations || []).filter((a) => a.active).map((a) => a.studentId)),
    [allocations],
  )

  const availableStudents = useMemo(
    () => (students || []).filter((s) => s.active !== false && !allocatedStudentIds.has(s.id)),
    [students, allocatedStudentIds],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [allocs, roomList] = await Promise.all([
        apiGet('/api/allocations'),
        apiGet('/api/rooms'),
      ])
      setAllocations(allocs || [])
      setRooms(roomList || [])
      if (canManage) {
        setStudents((await apiGet('/api/users?role=STUDENT')) || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load allocations')
    } finally {
      setLoading(false)
    }
  }, [canManage])

  useEffect(() => {
    load()
  }, [load])

  const handleAllocate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiPost('/api/allocations', {
        studentId,
        bedId,
      })
      setShowForm(false)
      setStudentId('')
      setBedId('')
      await load()
    } catch (err) {
      setError(err.message || 'Allocation failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDeallocate = async (id) => {
    if (!window.confirm('Deallocate this student?')) return
    try {
      await apiDelete(`/api/allocations/${id}`)
      await load()
    } catch (err) {
      setError(err.message || 'Deallocate failed')
    }
  }

  const displayedAllocations = useMemo(() => {
    const filtered = allocations.filter((allocation) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && allocation.active) ||
        (statusFilter === 'ENDED' && !allocation.active)
      const matchesQuery = matchesSearch(search, [
        allocation.studentName,
        allocation.studentEmail,
        allocation.roomNumber,
        allocation.bedLabel,
      ])
      return matchesStatus && matchesQuery
    })
    return sortRows(filtered, sortKey, sortDir, (allocation) => {
      if (sortKey === 'roomBed') return `${allocation.roomNumber} ${allocation.bedLabel}`
      if (sortKey === 'active') return allocation.active ? 1 : 0
      return allocation[sortKey]
    })
  }, [allocations, search, statusFilter, sortKey, sortDir])

  const handleSort = (key) => {
    const next = toggleSort(sortKey, sortDir, key)
    setSortKey(next.sortKey)
    setSortDir(next.sortDir)
  }

  const columns = [
    { key: 'studentName', label: 'Student' },
    { key: 'studentEmail', label: 'Email' },
    { key: 'roomBed', label: 'Room / Bed' },
    { key: 'allocatedAt', label: 'Allocated' },
    { key: 'active', label: 'Status' },
    ...(canManage ? [{ key: 'actions', label: 'Actions', sortable: false }] : []),
  ]

  return (
    <div>
      <PageHeader
        title="Allocations"
        subtitle="Assign students to vacant beds."
        actions={
          canManage ? (
            <ActionButton onClick={() => setShowForm(true)}>Allocate student</ActionButton>
          ) : null
        }
      />

      {error && <div className="mb-4"><ErrorBlock message={error} onRetry={load} /></div>}
      {loading && <LoadingBlock />}

      {showForm && canManage && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">Allocate bed</h2>
          <form onSubmit={handleAllocate} className="grid gap-4 sm:grid-cols-2">
            <Field label="Student">
              <select className={fieldClass} required value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                <option value="">Select student</option>
                {availableStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.studentId || s.email})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Vacant bed">
              <select className={fieldClass} required value={bedId} onChange={(e) => setBedId(e.target.value)}>
                <option value="">Select bed</option>
                {vacantBeds.map((b) => (
                  <option key={b.id} value={b.id}>{b.label}</option>
                ))}
              </select>
            </Field>
            <div className="flex gap-2 sm:col-span-2">
              <ActionButton type="submit" disabled={saving}>{saving ? 'Saving…' : 'Allocate'}</ActionButton>
              <ActionButton variant="ghost" onClick={() => setShowForm(false)}>Cancel</ActionButton>
            </div>
          </form>
        </Card>
      )}

      {!loading && allocations.length === 0 && <EmptyBlock message="No allocations yet." />}

      {!loading && allocations.length > 0 && (
        <>
          <TableToolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search student, email, room…" />
            <FilterSelect value={statusFilter} onChange={setStatusFilter}>
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="ENDED">Ended</option>
            </FilterSelect>
          </TableToolbar>

          {displayedAllocations.length === 0 ? (
            <EmptyBlock message="No allocations match your filters." />
          ) : (
            <Table sortableHeaders={columns} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>
              {displayedAllocations.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-3 font-medium">{a.studentName}</td>
              <td className="px-4 py-3">{a.studentEmail}</td>
              <td className="px-4 py-3">{a.roomNumber} · {a.bedLabel}</td>
              <td className="px-4 py-3 text-slate-500">
                {a.allocatedAt ? new Date(a.allocatedAt).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3">
                <StatusBadge tone={a.active ? 'green' : 'slate'}>{a.active ? 'Active' : 'Ended'}</StatusBadge>
              </td>
              {canManage && (
                <td className="px-4 py-3">
                  {a.active && (
                    <ActionButton variant="danger" onClick={() => handleDeallocate(a.id)}>
                      Deallocate
                    </ActionButton>
                  )}
                </td>
              )}
            </tr>
              ))}
            </Table>
          )}
        </>
      )}
    </div>
  )
}
