import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '../utils/api'
import { getSession } from '../utils/auth'
import ListToolbar, { useListControls } from '../components/ListToolbar'
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
  StatusBadge,
} from '../components/ui/Page'

const CATEGORIES = [
  { value: 'GENERAL', label: 'General' },
  { value: 'FEE', label: 'Fee' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'EVENT', label: 'Event' },
]

const AUDIENCES = [
  { value: 'ALL_STUDENTS', label: 'All Students' },
  { value: 'SPECIFIC_ROOM', label: 'Specific Room' },
  { value: 'SPECIFIC_STUDENT', label: 'Specific Student' },
]

const emptyForm = {
  title: '',
  description: '',
  category: 'GENERAL',
  targetAudience: 'ALL_STUDENTS',
  roomNumber: '',
  studentId: '',
  sendWhatsApp: true,
}

function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label || value || 'General'
}

function audienceLabel(value) {
  return AUDIENCES.find((a) => a.value === value)?.label || value
}

function statusTone(status) {
  return status === 'ACTIVE' ? 'green' : 'slate'
}

function formatWhatsAppFeedback(result) {
  if (!result) return { tone: 'info', text: '' }
  const sent = Number(result.sentCount || 0)
  const failed = Number(result.failedCount || 0)
  let text = result.message || 'WhatsApp request completed'
  if (sent > 0) {
    text = `${text} · ${sent} sent${failed > 0 ? `, ${failed} failed` : ''}`
  }
  if (result.failures?.length) {
    text += ` (${result.failures.slice(0, 2).join('; ')}${result.failures.length > 2 ? '…' : ''})`
  }
  const tone = sent > 0 ? 'success' : failed > 0 ? 'error' : 'warning'
  return { tone, text }
}

function WhatsAppStatusBanner({ status }) {
  if (!status) return null
  const isLive = status.configured
  const className = isLive
    ? 'mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300'
    : 'mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300'
  return (
    <div className={className}>
      <p className="font-medium">{isLive ? 'WhatsApp active (Twilio)' : 'WhatsApp preview mode'}</p>
      <p className="mt-1 text-[13px] opacity-90">{status.message}</p>
    </div>
  )
}

export default function NoticesPage() {
  const session = getSession()
  const canManage = ['SUPER_ADMIN', 'ADMIN', 'WARDEN'].includes(session?.role)

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState(canManage ? 'ALL' : 'ACTIVE')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [whatsappResult, setWhatsappResult] = useState(null)
  const [whatsappStatus, setWhatsappStatus] = useState(null)

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams()
    if (categoryFilter !== 'ALL') params.set('category', categoryFilter)
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (dateFrom) params.set('from', dateFrom)
    if (dateTo) params.set('to', dateTo)
    const qs = params.toString()
    return qs ? `/api/notices?${qs}` : '/api/notices'
  }, [categoryFilter, statusFilter, dateFrom, dateTo])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems((await apiGet(buildQuery())) || [])
    } catch (err) {
      setError(err.message || 'Failed to load notices')
    } finally {
      setLoading(false)
    }
  }, [buildQuery])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!canManage) return undefined
    let alive = true
    apiGet('/api/whatsapp/status')
      .then((data) => {
        if (alive) setWhatsappStatus(data)
      })
      .catch(() => {
        if (alive) setWhatsappStatus(null)
      })
    return () => {
      alive = false
    }
  }, [canManage])

  const { search, setSearch, sortKey, setSortKey, sortDir, setSortDir, filtered } = useListControls(items, {
    searchKeys: ['title', 'description', 'createdByName', 'category', 'roomNumber', 'studentId'],
    initialSortKey: 'createdAt',
    getSortValue: (item, key) =>
      key === 'createdAt' ? new Date(item.createdAt || 0).getTime() : item[key],
  })

  const selected = useMemo(
    () => items.find((n) => n.id === selectedId) || filtered.find((n) => n.id === selectedId) || null,
    [items, filtered, selectedId],
  )

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
    setWhatsappResult(null)
  }

  const applyWhatsAppFeedback = (result) => {
    if (!result) return
    setWhatsappResult(formatWhatsAppFeedback(result))
  }

  const openEdit = (notice) => {
    setEditingId(notice.id)
    setForm({
      title: notice.title || '',
      description: notice.description || '',
      category: notice.category || 'GENERAL',
      targetAudience: notice.targetAudience || 'ALL_STUDENTS',
      roomNumber: notice.roomNumber || '',
      studentId: notice.studentId || '',
      sendWhatsApp: false,
    })
    setShowForm(true)
    setWhatsappResult(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setWhatsappResult(null)
    try {
      const body = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        targetAudience: form.targetAudience,
        roomNumber: form.targetAudience === 'SPECIFIC_ROOM' ? form.roomNumber.trim() : null,
        studentId: form.targetAudience === 'SPECIFIC_STUDENT' ? form.studentId.trim() : null,
      }
      if (editingId) {
        await apiPut(`/api/notices/${editingId}`, { ...body, status: undefined })
      } else {
        const created = await apiPost('/api/notices', { ...body, sendWhatsApp: form.sendWhatsApp })
        if (form.sendWhatsApp) {
          applyWhatsAppFeedback(created?.whatsapp)
        }
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

  const handleExpire = async (id) => {
    try {
      await apiPatch(`/api/notices/${id}/expire`)
      await load()
    } catch (err) {
      setError(err.message || 'Failed to mark expired')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice permanently?')) return
    try {
      await apiDelete(`/api/notices/${id}`)
      if (selectedId === id) setSelectedId(null)
      await load()
    } catch (err) {
      setError(err.message || 'Delete failed')
    }
  }

  const handleSendWhatsApp = async (id) => {
    setWhatsappResult(null)
    try {
      const result = await apiPost('/api/notices/send-whatsapp', { noticeId: id })
      applyWhatsAppFeedback(result)
      await load()
    } catch (err) {
      setError(err.message || 'WhatsApp send failed')
    }
  }

  const handleView = async (notice) => {
    setSelectedId(notice.id)
    if (!notice.read) {
      try {
        await apiPatch(`/api/notices/${notice.id}/read`)
        await load()
      } catch {
        /* non-blocking */
      }
    }
  }

  return (
    <div>
      <PageHeader
        title="Notice & Alerts"
        subtitle="Hostel announcements with category targeting and Twilio WhatsApp delivery."
        actions={
          canManage ? (
            <ActionButton onClick={openCreate}>Create notice</ActionButton>
          ) : null
        }
      />

      {canManage && <WhatsAppStatusBanner status={whatsappStatus} />}

      {error && (
        <div className="mb-4">
          <ErrorBlock message={error} onRetry={load} />
        </div>
      )}
      {whatsappResult?.text && (
        <p
          className={[
            'mb-4 rounded-xl border px-4 py-3 text-sm',
            whatsappResult.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300'
              : whatsappResult.tone === 'error'
                ? 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300'
                : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300',
          ].join(' ')}
        >
          {whatsappResult.text}
        </p>
      )}
      {loading && <LoadingBlock label="Loading notices…" />}

      {showForm && canManage && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
            {editingId ? 'Edit notice' : 'Create notice / alert'}
          </h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Title">
              <input
                className={fieldClass}
                required
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
            </Field>
            <Field label="Category">
              <select
                className={fieldClass}
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Target audience" className="sm:col-span-2">
              <select
                className={fieldClass}
                value={form.targetAudience}
                onChange={(e) => setForm((p) => ({ ...p, targetAudience: e.target.value }))}
              >
                {AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </Field>
            {form.targetAudience === 'SPECIFIC_ROOM' && (
              <Field label="Room number">
                <input
                  className={fieldClass}
                  required
                  value={form.roomNumber}
                  onChange={(e) => setForm((p) => ({ ...p, roomNumber: e.target.value }))}
                  placeholder="e.g. 101"
                />
              </Field>
            )}
            {form.targetAudience === 'SPECIFIC_STUDENT' && (
              <Field label="Student ID">
                <input
                  className={fieldClass}
                  required
                  value={form.studentId}
                  onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
                  placeholder="User id or student code"
                />
              </Field>
            )}
            <Field label="Description" className="sm:col-span-2">
              <textarea
                className={`${fieldClass} min-h-28`}
                required
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </Field>
            {!editingId && (
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.sendWhatsApp}
                  onChange={(e) => setForm((p) => ({ ...p, sendWhatsApp: e.target.checked }))}
                />
                Send WhatsApp automatically to targeted students (Twilio)
              </label>
            )}
            <div className="flex gap-2 sm:col-span-2">
              <ActionButton type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Update notice' : 'Publish notice'}
              </ActionButton>
              <ActionButton variant="ghost" onClick={() => setShowForm(false)}>Cancel</ActionButton>
            </div>
          </form>
        </Card>
      )}

      {!loading && (
        <>
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <ListToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search notices…"
              sortOptions={[
                { value: 'createdAt', label: 'Sort by date' },
                { value: 'title', label: 'Sort by title' },
                { value: 'category', label: 'Sort by category' },
              ]}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortKeyChange={setSortKey}
              onSortDirChange={setSortDir}
            />
            <div className="flex flex-wrap gap-2">
              <FilterSelect value={categoryFilter} onChange={setCategoryFilter}>
                <option value="ALL">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </FilterSelect>
              {canManage && (
                <FilterSelect value={statusFilter} onChange={setStatusFilter}>
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                </FilterSelect>
              )}
              <input
                type="date"
                className={fieldClass}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="From date"
              />
              <input
                type="date"
                className={fieldClass}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="To date"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyBlock message="No notices found." />
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
              <div className="space-y-3">
                {filtered.map((n) => (
                  <Card
                    key={n.id}
                    className={[
                      'cursor-pointer transition-colors',
                      selectedId === n.id ? 'ring-2 ring-primary/40' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30',
                    ].join(' ')}
                    onClick={() => handleView(n)}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{n.title}</h3>
                          {!n.read && (
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                              Unread
                            </span>
                          )}
                          <StatusBadge tone={statusTone(n.status)}>{n.status}</StatusBadge>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {categoryLabel(n.category)} · {audienceLabel(n.targetAudience)}
                          {n.roomNumber ? ` · Room ${n.roomNumber}` : ''}
                          {n.studentId ? ` · Student ${n.studentId}` : ''}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN') : ''}
                      </p>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                      {n.description}
                    </p>
                  </Card>
                ))}
              </div>

              <Card className="h-fit xl:sticky xl:top-24">
                {!selected ? (
                  <p className="py-8 text-center text-sm text-slate-500">Select a notice to view details.</p>
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{selected.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {selected.createdByName || 'Staff'} ·{' '}
                          {selected.createdAt ? new Date(selected.createdAt).toLocaleString('en-IN') : ''}
                        </p>
                      </div>
                      <StatusBadge tone={statusTone(selected.status)}>{selected.status}</StatusBadge>
                    </div>
                    <dl className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-medium uppercase text-slate-500">Category</dt>
                        <dd className="text-slate-900 dark:text-white">{categoryLabel(selected.category)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium uppercase text-slate-500">Audience</dt>
                        <dd className="text-slate-900 dark:text-white">{audienceLabel(selected.targetAudience)}</dd>
                      </div>
                    </dl>
                    <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">
                      {selected.description}
                    </p>
                    {canManage && (
                      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                        <ActionButton variant="ghost" onClick={() => openEdit(selected)}>Edit</ActionButton>
                        {selected.status === 'ACTIVE' && (
                          <ActionButton variant="ghost" onClick={() => handleExpire(selected.id)}>
                            Mark expired
                          </ActionButton>
                        )}
                        <ActionButton variant="ghost" onClick={() => handleSendWhatsApp(selected.id)}>
                          Send WhatsApp
                        </ActionButton>
                        <ActionButton variant="danger" onClick={() => handleDelete(selected.id)}>
                          Delete
                        </ActionButton>
                      </div>
                    )}
                    {selected.whatsappSentAt && (
                      <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400">
                        WhatsApp sent {new Date(selected.whatsappSentAt).toLocaleString('en-IN')}
                      </p>
                    )}
                  </>
                )}
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
