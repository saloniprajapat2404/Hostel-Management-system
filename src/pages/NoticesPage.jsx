import { useCallback, useEffect, useState } from 'react'
import { apiDelete, apiGet, apiPost } from '../utils/api'
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
  Table,
} from '../components/ui/Page'

export default function NoticesPage() {
  const session = getSession()
  const canCreate = ['SUPER_ADMIN', 'ADMIN', 'WARDEN'].includes(session?.role)
  const canDelete = session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems((await apiGet('/api/notices')) || [])
    } catch (err) {
      setError(err.message || 'Failed to load notices')
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
      await apiPost('/api/notices', { title, body })
      setTitle('')
      setBody('')
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message || 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return
    try {
      await apiDelete(`/api/notices/${id}`)
      await load()
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  return (
    <div>
      <PageHeader
        title="Notices"
        subtitle="Hostel announcements and updates."
        actions={
          canCreate ? (
            <ActionButton onClick={() => setShowForm(true)}>New notice</ActionButton>
          ) : null
        }
      />

      {error && <div className="mb-4"><ErrorBlock message={error} onRetry={load} /></div>}
      {loading && <LoadingBlock />}

      {showForm && canCreate && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">Create notice</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <Field label="Title">
              <input className={fieldClass} required value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Body">
              <textarea
                className={`${fieldClass} min-h-28`}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </Field>
            <div className="flex gap-2">
              <ActionButton type="submit" disabled={saving}>{saving ? 'Publishing…' : 'Publish'}</ActionButton>
              <ActionButton variant="ghost" onClick={() => setShowForm(false)}>Cancel</ActionButton>
            </div>
          </form>
        </Card>
      )}

      {!loading && items.length === 0 && <EmptyBlock message="No notices yet." />}

      {!loading && items.length > 0 && (
        <div className="space-y-4">
          {items.map((n) => (
            <Card key={n.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{n.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {n.createdByName || 'Staff'} · {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                  </p>
                </div>
                {canDelete && (
                  <ActionButton variant="danger" onClick={() => handleDelete(n.id)}>Delete</ActionButton>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{n.body}</p>
            </Card>
          ))}
        </div>
      )}

      {!loading && items.length > 0 && canDelete && (
        <div className="mt-6">
          <Table headers={['Title', 'Author', 'Created']}>
            {items.map((n) => (
              <tr key={`row-${n.id}`}>
                <td className="px-4 py-3 font-medium">{n.title}</td>
                <td className="px-4 py-3">{n.createdByName}</td>
                <td className="px-4 py-3 text-slate-500">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}
    </div>
  )
}
