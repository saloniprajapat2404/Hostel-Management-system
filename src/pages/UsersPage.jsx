import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiDelete, apiGet, apiPost, apiPut } from '../utils/api'
import { getSession } from '../utils/auth'
import { mobileInputProps, normalizeMobile10 } from '../utils/phoneHelpers'
import { validateContactProfileFields } from '../utils/profileFieldHelpers'
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

const ROLE_TITLES = {
  ADMIN: 'Admins',
  WARDEN: 'Wardens',
  STUDENT: 'Students',
}

const emptyForm = {
  email: '',
  password: '',
  fullName: '',
  studentId: '',
  phone: '',
  whatsappNumber: '',
  parentPhone: '',
  aadharNumber: '',
  addressLine: '',
  city: '',
  state: '',
  pincode: '',
  active: true,
}

const profileFields = (form) => ({
  parentPhone: normalizeMobile10(form.parentPhone) || null,
  whatsappNumber: normalizeMobile10(form.whatsappNumber) || null,
  aadharNumber: form.aadharNumber.replace(/\D/g, '') || null,
  addressLine: form.addressLine || null,
  city: form.city || null,
  state: form.state || null,
  pincode: form.pincode.replace(/\D/g, '') || null,
})

export default function UsersPage() {
  const [params] = useSearchParams()
  const session = getSession()
  const role = (params.get('role') || 'STUDENT').toUpperCase()
  const canManage = session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN'
  const canCreate =
    session?.role === 'SUPER_ADMIN' ||
    (session?.role === 'ADMIN' && role !== 'ADMIN' && role !== 'SUPER_ADMIN')
  const readOnly = session?.role === 'WARDEN'

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortKey, setSortKey] = useState('fullName')
  const [sortDir, setSortDir] = useState('asc')

  const title = ROLE_TITLES[role] || 'Users'

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiGet(`/api/users?role=${role}`)
      setUsers(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [role])

  useEffect(() => {
    load()
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }, [load])

  const formTitle = useMemo(
    () => (editingId ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`),
    [editingId, title],
  )

  const displayedUsers = useMemo(() => {
    const filtered = users.filter((user) => {
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && user.active !== false) ||
        (statusFilter === 'INACTIVE' && user.active === false)
      const matchesQuery = matchesSearch(search, [
        user.fullName,
        user.email,
        user.studentId,
        user.phone,
      ])
      return matchesStatus && matchesQuery
    })
    return sortRows(filtered, sortKey, sortDir, (user) => {
      if (sortKey === 'active') return user.active !== false ? 1 : 0
      return user[sortKey]
    })
  }, [users, search, statusFilter, sortKey, sortDir])

  const handleSort = (key) => {
    const next = toggleSort(sortKey, sortDir, key)
    setSortKey(next.sortKey)
    setSortDir(next.sortDir)
  }

  const userColumns = canManage
    ? [
        { key: 'fullName', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'studentId', label: 'ID' },
        { key: 'phone', label: 'Phone' },
        { key: 'active', label: 'Status' },
        { key: 'actions', label: 'Actions', sortable: false },
      ]
    : [
        { key: 'fullName', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'studentId', label: 'Student ID' },
        { key: 'active', label: 'Status' },
      ]

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setShowForm(true)
  }

  const openEdit = (user) => {
    setEditingId(user.id)
    setForm({
      email: user.email || '',
      password: '',
      fullName: user.fullName || '',
      studentId: user.studentId || '',
      phone: user.phone || '',
      whatsappNumber: user.whatsappNumber || '',
      parentPhone: user.parentPhone || '',
      aadharNumber: user.aadharNumber || '',
      addressLine: user.addressLine || '',
      city: user.city || '',
      state: user.state || '',
      pincode: user.pincode || '',
      active: user.active !== false,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canManage) return
    if (!editingId && !canCreate) {
      setError('You do not have permission to create this user type.')
      return
    }
    const validationErr = validateContactProfileFields(form)
    if (validationErr) {
      setError(validationErr)
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editingId) {
        const body = {
          email: form.email,
          fullName: form.fullName,
          studentId: role === 'STUDENT' ? form.studentId || null : null,
          phone: normalizeMobile10(form.phone) || null,
          active: form.active,
          ...profileFields(form),
        }
        if (form.password) body.password = form.password
        await apiPut(`/api/users/${editingId}`, body)
      } else {
        const body = {
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          role,
          studentId: role === 'STUDENT' ? form.studentId || null : null,
          phone: normalizeMobile10(form.phone) || null,
          ...profileFields(form),
        }
        await apiPost('/api/users', body)
      }
      setShowForm(false)
      setEditingId(null)
      setForm(emptyForm)
      await load()
    } catch (err) {
      setError(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!canManage || !window.confirm('Delete this user?')) return
    if (id === session?.id) {
      setError('You cannot delete your own account')
      return
    }
    try {
      await apiDelete(`/api/users/${id}`)
      await load()
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={readOnly ? 'Students with room allocations (read-only).' : `Manage ${title.toLowerCase()}.`}
        actions={
          canCreate ? (
            <ActionButton onClick={openCreate}>{`Add ${title.slice(0, -1)}`}</ActionButton>
          ) : null
        }
      />

      {error && <div className="mb-4"><ErrorBlock message={error} onRetry={load} /></div>}
      {loading && <LoadingBlock />}

      {showForm && canManage && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{formTitle}</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <input className={fieldClass} required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            </Field>
            <Field label="Email" required>
              <input type="email" className={fieldClass} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label={editingId ? 'Password (optional)' : 'Password'} required={!editingId}>
              <input type="password" className={fieldClass} required={!editingId} minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <Field label="Phone" required>
              <input
                className={fieldClass}
                required
                {...mobileInputProps}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: normalizeMobile10(e.target.value) })}
              />
            </Field>
            {role === 'STUDENT' && (
              <Field label="Student ID">
                <input className={fieldClass} value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
              </Field>
            )}
            <Field label="Aadhar number" required>
              <input
                className={fieldClass}
                required
                inputMode="numeric"
                maxLength={14}
                placeholder="XXXX XXXX XXXX"
                value={form.aadharNumber.replace(/(\d{4})(?=\d)/g, '$1 ').trim()}
                onChange={(e) => setForm({ ...form, aadharNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
              />
            </Field>
            <Field label="Parent mobile no" required>
              <input
                className={fieldClass}
                required
                {...mobileInputProps}
                value={form.parentPhone}
                onChange={(e) =>
                  setForm({ ...form, parentPhone: normalizeMobile10(e.target.value) })
                }
              />
            </Field>
            <Field label="WhatsApp number">
              <input
                className={fieldClass}
                {...mobileInputProps}
                value={form.whatsappNumber}
                onChange={(e) =>
                  setForm({ ...form, whatsappNumber: normalizeMobile10(e.target.value) })
                }
                placeholder="10-digit number for notice alerts"
              />
            </Field>
            <Field label="Address line" required>
              <input className={fieldClass} required value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} />
            </Field>
            <Field label="City" required>
              <input className={fieldClass} required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </Field>
            <Field label="State" required>
              <input className={fieldClass} required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </Field>
            <Field label="Pincode">
              <input
                className={fieldClass}
                inputMode="numeric"
                maxLength={6}
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
              />
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

      {!loading && users.length === 0 && <EmptyBlock message={`No ${title.toLowerCase()} found.`} />}

      {!loading && users.length > 0 && (
        <>
          <TableToolbar>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search name, email, ID, phone…"
            />
            <FilterSelect value={statusFilter} onChange={setStatusFilter}>
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </FilterSelect>
          </TableToolbar>

          {displayedUsers.length === 0 ? (
            <EmptyBlock message="No users match your filters." />
          ) : (
            <Table
              sortableHeaders={userColumns}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            >
              {displayedUsers.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
              <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{u.fullName}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.studentId || '—'}</td>
              {canManage && <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.phone || '—'}</td>}
              <td className="px-4 py-3">
                <StatusBadge tone={u.active !== false ? 'green' : 'red'}>
                  {u.active !== false ? 'Active' : 'Inactive'}
                </StatusBadge>
              </td>
              {canManage && (
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <ActionButton variant="ghost" onClick={() => openEdit(u)}>Edit</ActionButton>
                    <ActionButton variant="danger" onClick={() => handleDelete(u.id)}>Delete</ActionButton>
                  </div>
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
