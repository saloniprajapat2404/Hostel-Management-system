import { useCallback, useEffect, useState } from 'react'
import { apiDelete, apiGet, apiPost } from '../utils/api'
import { getSession } from '../utils/auth'
import ListToolbar, { useListControls } from '../components/ListToolbar'
import {
  ActionButton,
  Card,
  EmptyBlock,
  ErrorBlock,
  Field,
  fieldClass,
  LoadingBlock,
  PageHeader,
} from '../components/ui/Page'

function whatsappShareUrl(title, body) {
  const text = `*${title}*\n\n${body}\n\n— Takshak Hostel Notice`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

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
  const [shareWhatsApp, setShareWhatsApp] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems((await apiGet('/api/notices')) || [])
    } catch (err) {
      setError(err.message || 'Failed to load notice')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const { search, setSearch, sortKey, setSortKey, sortDir, setSortDir, filtered } = useListControls(items, {
    searchKeys: ['title', 'body', 'createdByName'],
    initialSortKey: 'createdAt',
    getSortValue: (item, key) =>
      key === 'createdAt' ? new Date(item.createdAt || 0).getTime() : item[key],
  })

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiPost('/api/notices', { title, body })
      if (shareWhatsApp) {
        window.open(whatsappShareUrl(title, body), '_blank', 'noopener,noreferrer')
      }
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
        title="Notice"
        subtitle="Hostel announcements, alerts, and WhatsApp sharing."
        actions={
          canCreate ? (
            <ActionButton onClick={() => setShowForm(true)}>New notice</ActionButton>
          ) : null
        }
      />

      {error && (
        <div className="mb-4">
          <ErrorBlock message={error} onRetry={load} />
        </div>
      )}
      {loading && <LoadingBlock />}

      {showForm && canCreate && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">Create notice / alert</h2>
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
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={shareWhatsApp}
                onChange={(e) => setShareWhatsApp(e.target.checked)}
              />
              Share via WhatsApp after publishing
            </label>
            <div className="flex gap-2">
              <ActionButton type="submit" disabled={saving}>
                {saving ? 'Publishing…' : 'Publish'}
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </ActionButton>
            </div>
          </form>
        </Card>
      )}

      {!loading && (
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search notice…"
          sortOptions={[
            { value: 'createdAt', label: 'Sort by date' },
            { value: 'title', label: 'Sort by title' },
          ]}
          sortKey={sortKey}
          sortDir={sortDir}
          onSortKeyChange={setSortKey}
          onSortDirChange={setSortDir}
        />
      )}

      {!loading && filtered.length === 0 && <EmptyBlock message="No notice yet." />}

      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((n) => (
            <Card key={n.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{n.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {n.createdByName || 'Staff'} ·{' '}
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={whatsappShareUrl(n.title, n.body)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                  >
                    WhatsApp
                  </a>
                  {canDelete && (
                    <ActionButton variant="danger" onClick={() => handleDelete(n.id)}>
                      Delete
                    </ActionButton>
                  )}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{n.body}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
