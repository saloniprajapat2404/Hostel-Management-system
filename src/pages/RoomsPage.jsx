import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { BedDouble, Building2, DoorOpen, Wrench } from 'lucide-react'
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

const emptyForm = {
  roomNumber: '',
  floor: 1,
  capacity: 2,
  active: true,
  wing: '',
  gender: 'MIXED',
  roomType: 'STANDARD',
  status: 'AVAILABLE',
  notes: '',
}

const emptyBulk = {
  prefix: 'R',
  startNumber: 1,
  count: 5,
  padDigits: 2,
  floor: 1,
  capacity: 2,
  wing: '',
  gender: 'MIXED',
  roomType: 'STANDARD',
}

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'INACTIVE', 'VACANT', 'MAINTENANCE', 'FULL']

function statusTone(room) {
  if (room.active === false) return 'red'
  if (room.status === 'MAINTENANCE') return 'amber'
  if (room.status === 'FULL' || room.vacantCount === 0) return 'slate'
  return 'green'
}

function statusLabel(room) {
  if (room.active === false) return 'Inactive'
  if (room.status === 'MAINTENANCE') return 'Maintenance'
  if (room.status === 'FULL' || room.vacantCount === 0) return 'Full'
  return 'Available'
}

function bedTone(bed) {
  if (bed.underMaintenance) return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
  if (bed.occupied) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
  return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
}

function bedLabel(bed) {
  if (bed.underMaintenance) return `${bed.bedLabel} · Maintenance`
  if (bed.occupied) {
    return `${bed.bedLabel} · ${bed.occupantName || 'Occupied'}`
  }
  return `${bed.bedLabel} · Vacant`
}

export default function RoomsPage() {
  const session = getSession()
  const [params] = useSearchParams()
  const canManage = session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN'
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [bulk, setBulk] = useState(emptyBulk)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showBulk, setShowBulk] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [floorFilter, setFloorFilter] = useState('ALL')
  const [wingFilter, setWingFilter] = useState('ALL')
  const [genderFilter, setGenderFilter] = useState('ALL')
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
    setShowBulk(false)
    setShowForm(true)
  }

  const openBulk = () => {
    setShowForm(false)
    setBulk(emptyBulk)
    setShowBulk(true)
  }

  const openEdit = (room) => {
    setEditingId(room.id)
    setForm({
      roomNumber: room.roomNumber || '',
      floor: room.floor || 1,
      capacity: room.capacity || 2,
      active: room.active !== false,
      wing: room.wing || '',
      gender: room.gender || 'MIXED',
      roomType: room.roomType || 'STANDARD',
      status: room.status || 'AVAILABLE',
      notes: room.notes || '',
    })
    setShowBulk(false)
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = {
        roomNumber: form.roomNumber.trim(),
        floor: Number(form.floor),
        capacity: Number(form.capacity),
        wing: form.wing.trim() || null,
        gender: form.gender,
        roomType: form.roomType,
        status: form.status,
        notes: form.notes.trim() || null,
      }
      if (editingId) {
        await apiPut(`/api/rooms/${editingId}`, { ...body, active: form.active })
      } else {
        await apiPost('/api/rooms', body)
      }
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiPost('/api/rooms/bulk', {
        prefix: bulk.prefix.trim().toUpperCase(),
        startNumber: Number(bulk.startNumber),
        count: Number(bulk.count),
        padDigits: Number(bulk.padDigits),
        floor: Number(bulk.floor),
        capacity: Number(bulk.capacity),
        wing: bulk.wing.trim() || null,
        gender: bulk.gender,
        roomType: bulk.roomType,
        status: 'AVAILABLE',
      })
      setShowBulk(false)
      await load()
    } catch (err) {
      setError(err.message || 'Bulk create failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this room? Occupied rooms cannot be deleted.')) return
    try {
      await apiDelete(`/api/rooms/${id}`)
      await load()
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  const toggleBedMaintenance = async (room, bed) => {
    if (!canManage) return
    if (bed.occupied) {
      setError('Deallocate the student before marking a bed under maintenance.')
      return
    }
    try {
      await apiPut(`/api/rooms/${room.id}/beds/${bed.id}`, {
        underMaintenance: !bed.underMaintenance,
      })
      await load()
    } catch (err) {
      setError(err.message || 'Could not update bed')
    }
  }

  const floorOptions = useMemo(() => {
    return [...new Set(rooms.map((room) => room.floor))].sort((a, b) => a - b)
  }, [rooms])

  const wingOptions = useMemo(() => {
    return [...new Set(rooms.map((room) => room.wing).filter(Boolean))].sort()
  }, [rooms])

  const summary = useMemo(() => {
    const activeRooms = rooms.filter((r) => r.active !== false)
    const beds = rooms.flatMap((r) => r.beds || [])
    return {
      rooms: activeRooms.length,
      beds: beds.length,
      occupied: beds.filter((b) => b.occupied).length,
      vacant: beds.filter((b) => !b.occupied && !b.underMaintenance).length,
      maintenance: beds.filter((b) => b.underMaintenance).length
        + activeRooms.filter((r) => r.status === 'MAINTENANCE').length,
    }
  }, [rooms])

  const displayedRooms = useMemo(() => {
    const filtered = rooms.filter((room) => {
      const matchesFloor = floorFilter === 'ALL' || String(room.floor) === floorFilter
      const matchesWing =
        wingFilter === 'ALL' ||
        (wingFilter === 'NONE' ? !room.wing : room.wing === wingFilter)
      const matchesGender = genderFilter === 'ALL' || room.gender === genderFilter
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && room.active !== false && room.status !== 'MAINTENANCE') ||
        (statusFilter === 'INACTIVE' && room.active === false) ||
        (statusFilter === 'VACANT' && room.vacantCount > 0 && room.active !== false) ||
        (statusFilter === 'MAINTENANCE' && room.status === 'MAINTENANCE') ||
        (statusFilter === 'FULL' && (room.status === 'FULL' || room.vacantCount === 0) && room.active !== false)
      const bedLabels = (room.beds || []).map((b) => b.bedLabel)
      const occupants = (room.beds || []).map((b) => b.occupantName).filter(Boolean)
      const matchesQuery = matchesSearch(search, [
        room.roomNumber,
        String(room.floor),
        room.wing,
        room.gender,
        room.roomType,
        room.notes,
        ...bedLabels,
        ...occupants,
      ])
      return matchesFloor && matchesWing && matchesGender && matchesStatus && matchesQuery
    })
    return sortRows(filtered, sortKey, sortDir, (room) => {
      if (sortKey === 'active') return room.active !== false ? 1 : 0
      return room[sortKey]
    })
  }, [rooms, search, floorFilter, wingFilter, genderFilter, statusFilter, sortKey, sortDir])

  const handleSort = (key) => {
    const next = toggleSort(sortKey, sortDir, key)
    setSortKey(next.sortKey)
    setSortDir(next.sortDir)
  }

  const columns = [
    { key: 'roomNumber', label: 'Room' },
    { key: 'floor', label: 'Floor' },
    { key: 'wing', label: 'Wing' },
    { key: 'gender', label: 'Gender' },
    { key: 'occupiedCount', label: 'Occupied' },
    { key: 'vacantCount', label: 'Vacant' },
    { key: 'status', label: 'Status' },
  ]

  return (
    <div>
      <PageHeader
        title="Rooms"
        subtitle="Manage hostel rooms, beds, wings, and maintenance."
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <ActionButton onClick={openCreate}>Add room</ActionButton>
              <ActionButton variant="ghost" onClick={openBulk}>
                Bulk create
              </ActionButton>
            </div>
          ) : null
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorBlock message={error} onRetry={load} />
        </div>
      )}
      {loading && <LoadingBlock />}

      {!loading && rooms.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="flex items-center gap-3">
              <DoorOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-slate-500">Active rooms</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">{summary.rooms}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <BedDouble className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-slate-500">Beds · Vacant</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {summary.beds} · {summary.vacant}
                </p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-slate-500">Occupied</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">{summary.occupied}</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3">
              <Wrench className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-xs text-slate-500">Maintenance</p>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">{summary.maintenance}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showForm && canManage && (
        <Card className="mb-6">
          <h2 className="mb-1 text-lg font-semibold">{editingId ? 'Edit room' : 'Add room'}</h2>
          <p className="mb-4 text-sm text-slate-500">
            Fields marked with <span className="text-red-500">*</span> are mandatory.
          </p>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Room number" required>
              <input
                className={fieldClass}
                required
                value={form.roomNumber}
                onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                placeholder="e.g. R01"
              />
            </Field>
            <Field label="Floor" required>
              <input
                type="number"
                min={1}
                max={10}
                className={fieldClass}
                required
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: e.target.value })}
              />
            </Field>
            <Field label="Capacity" required>
              <input
                type="number"
                min={1}
                max={12}
                className={fieldClass}
                required
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
            </Field>
            <Field label="Wing / block">
              <input
                className={fieldClass}
                value={form.wing}
                onChange={(e) => setForm({ ...form, wing: e.target.value })}
                placeholder="e.g. A, East"
              />
            </Field>
            <Field label="Gender" required>
              <select
                className={fieldClass}
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="MIXED">Mixed</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </Field>
            <Field label="Room type" required>
              <select
                className={fieldClass}
                value={form.roomType}
                onChange={(e) => setForm({ ...form, roomType: e.target.value })}
              >
                <option value="STANDARD">Standard</option>
                <option value="AC">AC</option>
                <option value="NON_AC">Non-AC</option>
              </select>
            </Field>
            <Field label="Operational status" required>
              <select
                className={fieldClass}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="AVAILABLE">Available</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="FULL">Full</option>
              </select>
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <input
                className={fieldClass}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </Field>
            {editingId && (
              <Field label="Room status" required>
                <select
                  className={fieldClass}
                  value={form.active !== false ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </Field>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <ActionButton type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </ActionButton>
            </div>
          </form>
        </Card>
      )}

      {showBulk && canManage && (
        <Card className="mb-6">
          <h2 className="mb-1 text-lg font-semibold">Bulk create rooms</h2>
          <p className="mb-4 text-sm text-slate-500">
            Example: prefix R, start 1, count 5, pad 2 → R01…R05
          </p>
          <form onSubmit={handleBulkSubmit} className="grid gap-4 sm:grid-cols-3">
            <Field label="Prefix" required>
              <input
                className={fieldClass}
                required
                value={bulk.prefix}
                onChange={(e) => setBulk({ ...bulk, prefix: e.target.value })}
              />
            </Field>
            <Field label="Start number" required>
              <input
                type="number"
                min={1}
                className={fieldClass}
                required
                value={bulk.startNumber}
                onChange={(e) => setBulk({ ...bulk, startNumber: e.target.value })}
              />
            </Field>
            <Field label="Count" required>
              <input
                type="number"
                min={1}
                max={50}
                className={fieldClass}
                required
                value={bulk.count}
                onChange={(e) => setBulk({ ...bulk, count: e.target.value })}
              />
            </Field>
            <Field label="Pad digits" required>
              <input
                type="number"
                min={1}
                max={4}
                className={fieldClass}
                required
                value={bulk.padDigits}
                onChange={(e) => setBulk({ ...bulk, padDigits: e.target.value })}
              />
            </Field>
            <Field label="Floor" required>
              <input
                type="number"
                min={1}
                max={10}
                className={fieldClass}
                required
                value={bulk.floor}
                onChange={(e) => setBulk({ ...bulk, floor: e.target.value })}
              />
            </Field>
            <Field label="Capacity" required>
              <input
                type="number"
                min={1}
                max={12}
                className={fieldClass}
                required
                value={bulk.capacity}
                onChange={(e) => setBulk({ ...bulk, capacity: e.target.value })}
              />
            </Field>
            <Field label="Wing">
              <input
                className={fieldClass}
                value={bulk.wing}
                onChange={(e) => setBulk({ ...bulk, wing: e.target.value })}
              />
            </Field>
            <Field label="Gender">
              <select
                className={fieldClass}
                value={bulk.gender}
                onChange={(e) => setBulk({ ...bulk, gender: e.target.value })}
              >
                <option value="MIXED">Mixed</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </Field>
            <Field label="Room type">
              <select
                className={fieldClass}
                value={bulk.roomType}
                onChange={(e) => setBulk({ ...bulk, roomType: e.target.value })}
              >
                <option value="STANDARD">Standard</option>
                <option value="AC">AC</option>
                <option value="NON_AC">Non-AC</option>
              </select>
            </Field>
            <div className="flex gap-2 sm:col-span-3">
              <ActionButton type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Create rooms'}
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => setShowBulk(false)}>
                Cancel
              </ActionButton>
            </div>
          </form>
        </Card>
      )}

      {!loading && rooms.length === 0 && <EmptyBlock message="No rooms yet. Add or bulk-create rooms." />}

      {!loading && rooms.length > 0 && (
        <>
          <TableToolbar>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search room, bed, wing, occupant…"
            />
            <FilterSelect value={floorFilter} onChange={setFloorFilter}>
              <option value="ALL">All floors</option>
              {floorOptions.map((floor) => (
                <option key={floor} value={String(floor)}>
                  Floor {floor}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={wingFilter} onChange={setWingFilter}>
              <option value="ALL">All wings</option>
              <option value="NONE">No wing</option>
              {wingOptions.map((wing) => (
                <option key={wing} value={wing}>
                  Wing {wing}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={genderFilter} onChange={setGenderFilter}>
              <option value="ALL">All genders</option>
              <option value="MIXED">Mixed</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </FilterSelect>
            <FilterSelect value={statusFilter} onChange={setStatusFilter}>
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Available</option>
              <option value="VACANT">Has vacant beds</option>
              <option value="FULL">Full</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="INACTIVE">Inactive</option>
            </FilterSelect>
          </TableToolbar>

          {displayedRooms.length === 0 ? (
            <EmptyBlock message="No rooms match your filters." />
          ) : (
            <>
              <div className="space-y-4">
                {displayedRooms.map((room) => (
                  <Card key={room.id}>
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          Room {room.roomNumber}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Floor {room.floor}
                          {room.wing ? ` · Wing ${room.wing}` : ''}
                          {` · ${room.gender || 'MIXED'} · ${room.roomType || 'STANDARD'}`}
                          {` · Occupied ${room.occupiedCount}/${room.capacity}`}
                          {room.maintenanceBedCount > 0
                            ? ` · ${room.maintenanceBedCount} bed(s) maintenance`
                            : ''}
                        </p>
                        {room.notes ? (
                          <p className="mt-1 text-xs text-slate-500">{room.notes}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge tone={statusTone(room)}>{statusLabel(room)}</StatusBadge>
                        {canManage && (
                          <>
                            <ActionButton variant="ghost" onClick={() => openEdit(room)}>
                              Edit
                            </ActionButton>
                            <ActionButton variant="danger" onClick={() => handleDelete(room.id)}>
                              Deactivate
                            </ActionButton>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(room.beds || []).map((bed) => (
                        <button
                          key={bed.id}
                          type="button"
                          disabled={!canManage || bed.occupied}
                          title={
                            canManage && !bed.occupied
                              ? 'Click to toggle bed maintenance'
                              : bed.occupantStudentId
                                ? `Student ID: ${bed.occupantStudentId}`
                                : undefined
                          }
                          onClick={() => toggleBedMaintenance(room, bed)}
                          className={`rounded-xl px-3 py-1.5 text-left text-xs font-semibold transition ${bedTone(bed)} ${
                            canManage && !bed.occupied ? 'hover:ring-2 hover:ring-primary/30' : 'cursor-default'
                          }`}
                        >
                          {bedLabel(bed)}
                        </button>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-6">
                <Table sortableHeaders={columns} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>
                  {displayedRooms.map((room) => (
                    <tr key={`row-${room.id}`}>
                      <td className="px-4 py-3 font-medium">{room.roomNumber}</td>
                      <td className="px-4 py-3">{room.floor}</td>
                      <td className="px-4 py-3">{room.wing || '—'}</td>
                      <td className="px-4 py-3">{room.gender || 'MIXED'}</td>
                      <td className="px-4 py-3">{room.occupiedCount}</td>
                      <td className="px-4 py-3">{room.vacantCount}</td>
                      <td className="px-4 py-3">
                        <StatusBadge tone={statusTone(room)}>{statusLabel(room)}</StatusBadge>
                      </td>
                    </tr>
                  ))}
                </Table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
