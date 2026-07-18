import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiGet, apiPatch, apiPost } from '../utils/api'
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

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED']

const toneFor = (status) => {
  if (status === 'RESOLVED') return 'green'
  if (status === 'IN_PROGRESS') return 'amber'
  return 'red'
}

export default function ComplaintsPage() {
  const session = getSession()
  const [params] = useSearchParams()
  const isStudent = session?.role === 'STUDENT'
  const canUpdate = ['SUPER_ADMIN', 'ADMIN', 'WARDEN'].includes(session?.role)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(() => {
    const status = params.get('status')?.toUpperCase()
    return STATUSES.includes(status) ? status : 'ALL'
  })
  const [sortKey, setSortKey] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems((await apiGet('/api/complaints')) || [])
    } catch (err) {
      setError(err.message || 'Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiPost('/api/complaints', { title, description })
      setTitle('')
      setDescription('')
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message || 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      await apiPatch(`/api/complaints/${id}/status`, { status })
      await load()
    } catch (err) {
      setError(err.message || 'Status update failed')
    }
  }

  const displayedItems = useMemo(() => {
    const filtered = items.filter((item) => {
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter
      const matchesQuery = matchesSearch(search, [item.title, item.studentName, item.description])
      return matchesStatus && matchesQuery
    })
    return sortRows(filtered, sortKey, sortDir, (item) => item[sortKey])
  }, [items, search, statusFilter, sortKey, sortDir])

  const handleSort = (key) => {
    const next = toggleSort(sortKey, sortDir, key)
    setSortKey(next.sortKey)
    setSortDir(next.sortDir)
  }

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'studentName', label: 'Student' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created' },
    { key: 'update', label: canUpdate ? 'Update' : 'Description', sortable: false },
  ]

  return (
    <div>
      <PageHeader
        title="Complaints"
        subtitle={isStudent ? 'File and track your complaints.' : 'Review and update complaint status.'}
        actions={
          isStudent ? (
            <ActionButton onClick={() => setShowForm(true)}>New complaint</ActionButton>
          ) : null
        }
      />

      {error && <div className="mb-4"><ErrorBlock message={error} onRetry={load} /></div>}
      {loading && <LoadingBlock />}

      {showForm && isStudent && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">New complaint</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Title">
              <input className={fieldClass} required value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Description">
              <textarea
                className={`${fieldClass} min-h-28`}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <div className="flex gap-2">
              <ActionButton type="submit" disabled={saving}>{saving ? 'Submitting…' : 'Submit'}</ActionButton>
              <ActionButton variant="ghost" onClick={() => setShowForm(false)}>Cancel</ActionButton>
            </div>
          </form>
        </Card>
      )}

      {!loading && items.length === 0 && <EmptyBlock message="No complaints found." />}

      {!loading && items.length > 0 && (
        <>
          <TableToolbar>
            <SearchInput value={search} onChange={setSearch} placeholder="Search title, student, description…" />
            <FilterSelect value={statusFilter} onChange={setStatusFilter}>
              <option value="ALL">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </FilterSelect>
          </TableToolbar>

          {displayedItems.length === 0 ? (
            <EmptyBlock message="No complaints match your filters." />
          ) : (
            <Table sortableHeaders={columns} sortKey={sortKey} sortDir={sortDir} onSort={handleSort}>
              {displayedItems.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900 dark:text-white">{c.title}</p>
                <p className="mt-1 max-w-md text-xs text-slate-500">{c.description}</p>
              </td>
              <td className="px-4 py-3">{c.studentName}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={toneFor(c.status)}>{c.status}</StatusBadge>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3">
                {canUpdate ? (
                  <select
                    className={fieldClass}
                    value={c.status}
                    onChange={(e) => updateStatus(c.id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <span className="text-xs text-slate-400">{c.handledByName || '—'}</span>
                )}
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
