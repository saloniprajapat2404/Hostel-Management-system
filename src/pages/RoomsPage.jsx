import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiDelete, apiGet, apiPost, apiPut } from '../utils/api'
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

const emptyForm = { roomNumber: '', floor: 1, capacity: 2, active: true }
const STATUS_FILTERS = ['ALL', 'ACTIVE', 'INACTIVE', 'VACANT']

export default function RoomsPage() {
  const session = getSession()
  const [params] = useSearchParams()
  const canManage = session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN'
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [floorFilter, setFloorFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState(() => {
    const status = params.get('status')?.toUpperCase()
    return STATUS_FILTERS.includes(status) ? status : 'ALL'
  })
  const [sortKey, setSortKey] = useState('roomNumber')
  const [sortDir, setSortDir] = useState('asc')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setRooms((await apiGet('/api/rooms')) || [])
    } catch (err) {
      setError(err.message || 'Failed to load rooms')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const openEdit = (room) => {
    setEditingId(room.id)
    setForm({
      roomNumber: room.roomNumber,
      floor: room.floor,
      capacity: room.capacity,
      active: room.active,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await apiPut(`/api/rooms/${editingId}`, {
          roomNumber: form.roomNumber,
          floor: Number(form.floor),
          capacity: Number(form.capacity),
          active: form.active,
        })
      } else {
        await apiPost('/api/rooms', {
          roomNumber: form.roomNumber,
          floor: Number(form.floor),
          capacity: Number(form.capacity),
        })
      }
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this room?')) return
    try {
      await apiDelete(`/api/rooms/${id}`)
      await load()
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  const floorOptions = useMemo(() => {
    const floors = [...new Set(rooms.map((room) => room.floor))].sort((a, b) => a - b)
    return floors
  }, [rooms])

  const displayedRooms = useMemo(() => {
    const filtered = rooms.filter((room) => {
      const matchesFloor = floorFilter === 'ALL' || String(room.floor) === floorFilter
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && room.active !== false) ||
        (statusFilter === 'INACTIVE' && room.active === false) ||
        (statusFilter === 'VACANT' && room.vacantCount > 0)
      const matchesQuery = matchesSearch(search, [room.roomNumber, String(room.floor)])
      return matchesFloor && matchesStatus && matchesQuery
    })
    return sortRows(filtered, sortKey, sortDir, (room) => {
      if (sortKey === 'active') return room.active !== false ? 1 : 0
      return room[sortKey]
    })
  }, [rooms, search, floorFilter, statusFilter, sortKey, sortDir])

  const handleSort = (key) => {
    const next = toggleSort(sortKey, sortDir, key)
    setSortKey(next.sortKey)
    setSortDir(next.sortDir)
  }

  const columns = [
    { key: 'roomNumber', label: 'Room' },
    { key: 'floor', label: 'Floor' },
    { key: 'occupiedCount', label: 'Occupied' },
    { key: 'vacantCount', label: 'Vacant' },
    { key: 'active', label: 'Status' },
  ]

  return (
    <div>
      <PageHeader
        title="Rooms"
        subtitle="Hostel rooms and bed occupancy."
        actions={canManage ? <ActionButton onClick={openCreate}>Add room</ActionButton> : null}
      />

      {error && <div className="mb-4"><ErrorBlock message={error} onRetry={load} /></div>}
      {loading && <LoadingBlock />}

      {showForm && canManage && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">{editingId ? 'Edit room' : 'Add room'}</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Room number" required>
              <input className={fieldClass} required value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} />
            </Field>
            <Field label="Floor" required>
              <input type="number" min={1} max={5} className={fieldClass} required value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} />
            </Field>
            <Field label="Capacity" required>
              <input type="number" min={1} className={fieldClass} required value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </Field>
            {editingId && (
              <Field label="Active">
                <select className={fieldClass} value={form.active ? 'true' : 'false'} onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </Field>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <ActionButton type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</ActionButton>
              <ActionButton variant="ghost" onClick={() => setShowForm(false)}>Cancel</ActionButton>
            </div>
          </form>
        </Card>
      )}

      {!loading && rooms.length === 0 && <EmptyBlock />}

      {!loading && rooms.length > 0 && (
        <>
          <TableToolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search room number…" />
            <FilterSelect value={floorFilter} onChange={setFloorFilter}>
              <option value="ALL">All floors</option>
              {floorOptions.map((floor) => (
                <option key={floor} value={String(floor)}>Floor {floor}</option>
              ))}
            </FilterSelect>
            <FilterSelect value={statusFilter} onChange={setStatusFilter}>
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="VACANT">Has vacant beds</option>
            </FilterSelect>
          </TableToolbar>

          <div className="space-y-4">
            {displayedRooms.map((room) => (
            <Card key={room.id}>
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Room {room.roomNumber}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Floor {room.floor} · Capacity {room.capacity} · Occupied {room.occupiedCount}/{room.capacity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge tone={room.active ? 'green' : 'red'}>{room.active ? 'Active' : 'Inactive'}</StatusBadge>
                  {canManage && (
                    <>
                      <ActionButton variant="ghost" onClick={() => openEdit(room)}>Edit</ActionButton>
                      <ActionButton variant="danger" onClick={() => handleDelete(room.id)}>Delete</ActionButton>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(room.beds || []).map((bed) => (
                  <span
                    key={bed.id}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                      bed.occupied
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    }`}
                  >
                    {bed.bedLabel} · {bed.occupied ? 'Occupied' : 'Vacant'}
                  </span>
                ))}
              </div>
            </Card>
            ))}
          </div>

          {displayedRooms.length === 0 ? (
            <EmptyBlock message="No rooms match your filters." />
          ) : (
            <div className="mt-6">
              <Table sortableHeaders={columns} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>
                {displayedRooms.map((room) => (
              <tr key={`row-${room.id}`}>
                <td className="px-4 py-3 font-medium">{room.roomNumber}</td>
                <td className="px-4 py-3">{room.floor}</td>
                <td className="px-4 py-3">{room.occupiedCount}</td>
                <td className="px-4 py-3">{room.vacantCount}</td>
                <td className="px-4 py-3">{room.active ? 'Active' : 'Inactive'}</td>
              </tr>
                ))}
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
