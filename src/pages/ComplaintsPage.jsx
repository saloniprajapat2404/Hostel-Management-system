import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPatch, apiPost } from '../utils/api'
import { getSession } from '../utils/auth'
import {
  ActionButton,
  Card,
  EmptyBlock,
  ErrorBlock,
  Field,
  fieldClass,
  LoadingBlock,
  PageHeader,
  StatusBadge,
  Table,
} from '../components/ui/Page'

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED']

const toneFor = (status) => {
  if (status === 'RESOLVED') return 'green'
  if (status === 'IN_PROGRESS') return 'amber'
  return 'red'
}

export default function ComplaintsPage() {
  const session = getSession()
  const isStudent = session?.role === 'STUDENT'
  const canUpdate = ['SUPER_ADMIN', 'ADMIN', 'WARDEN'].includes(session?.role)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

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
        <Table headers={['Title', 'Student', 'Status', 'Created', ...(canUpdate ? ['Update'] : ['Description'])]}>
          {items.map((c) => (
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
    </div>
  )
}
