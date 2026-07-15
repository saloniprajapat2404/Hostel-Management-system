import { useCallback, useEffect, useState } from 'react'
import { apiGet, apiPost } from '../utils/api'
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

const emptyForm = {
  studentName: '',
  email: '',
  phone: '',
  studentId: '',
  notes: '',
}

const toneFor = (status) => {
  if (status === 'APPROVED') return 'green'
  if (status === 'REJECTED') return 'red'
  return 'amber'
}

export default function AdmissionsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems((await apiGet('/api/admissions')) || [])
    } catch (err) {
      setError(err.message || 'Failed to load admissions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiPost('/api/admissions', form)
      setForm(emptyForm)
      setShowForm(false)
      await load()
    } catch (err) {
      setError(err.message || 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const decide = async (id, action) => {
    try {
      await apiPost(`/api/admissions/${id}/${action}`)
      await load()
    } catch (err) {
      setError(err.message || `${action} failed`)
    }
  }

  return (
    <div>
      <PageHeader
        title="Admissions"
        subtitle="Review and create hostel admission requests."
        actions={<ActionButton onClick={() => setShowForm(true)}>Add admission</ActionButton>}
      />

      {error && <div className="mb-4"><ErrorBlock message={error} onRetry={load} /></div>}
      {loading && <LoadingBlock />}

      {showForm && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">New admission</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Student name">
              <input className={fieldClass} required value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} />
            </Field>
            <Field label="Email">
              <input type="email" className={fieldClass} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className={fieldClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Student ID">
              <input className={fieldClass} required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
            </Field>
            <Field label="Notes">
              <input className={fieldClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
            <div className="flex gap-2 sm:col-span-2">
              <ActionButton type="submit" disabled={saving}>{saving ? 'Saving…' : 'Submit'}</ActionButton>
              <ActionButton variant="ghost" onClick={() => setShowForm(false)}>Cancel</ActionButton>
            </div>
          </form>
        </Card>
      )}

      {!loading && items.length === 0 && <EmptyBlock message="No admission requests." />}

      {!loading && items.length > 0 && (
        <Table headers={['Student', 'Email', 'Student ID', 'Status', 'Created', 'Actions']}>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-3 font-medium">{item.studentName}</td>
              <td className="px-4 py-3">{item.email}</td>
              <td className="px-4 py-3">{item.studentId}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={toneFor(item.status)}>{item.status}</StatusBadge>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3">
                {item.status === 'PENDING' ? (
                  <div className="flex flex-wrap gap-2">
                    <ActionButton variant="success" onClick={() => decide(item.id, 'approve')}>Approve</ActionButton>
                    <ActionButton variant="danger" onClick={() => decide(item.id, 'reject')}>Reject</ActionButton>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">
                    {item.reviewedByName ? `By ${item.reviewedByName}` : '—'}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}
