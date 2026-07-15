import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost } from '../utils/api'
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

export default function AttendancePage() {
  const session = getSession()
  const canRecord = session?.role === 'WARDEN'
  const [items, setItems] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [studentId, setStudentId] = useState('')
  const [type, setType] = useState('CHECK_IN')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [attendance, allocations] = await Promise.all([
        apiGet('/api/attendance'),
        apiGet('/api/allocations'),
      ])
      setItems(attendance || [])
      const map = new Map()
      for (const a of allocations || []) {
        if (a.active && !map.has(a.studentId)) {
          map.set(a.studentId, {
            id: a.studentId,
            name: a.studentName,
            code: a.studentCode,
          })
        }
      }
      setStudents([...map.values()])
    } catch (err) {
      setError(err.message || 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const studentOptions = useMemo(() => students, [students])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiPost('/api/attendance', {
        studentId: Number(studentId),
        type,
        notes: notes || null,
      })
      setShowForm(false)
      setStudentId('')
      setType('CHECK_IN')
      setNotes('')
      await load()
    } catch (err) {
      setError(err.message || 'Record failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Student check-in and check-out records."
        actions={
          canRecord ? (
            <ActionButton onClick={() => setShowForm(true)}>Record attendance</ActionButton>
          ) : null
        }
      />

      {error && <div className="mb-4"><ErrorBlock message={error} onRetry={load} /></div>}
      {loading && <LoadingBlock />}

      {showForm && canRecord && (
        <Card className="mb-6">
          <h2 className="mb-4 text-lg font-semibold">Check-in / Check-out</h2>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Student">
              <select className={fieldClass} required value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                <option value="">Select student</option>
                {studentOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code || s.id})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Type">
              <select className={fieldClass} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="CHECK_IN">CHECK_IN</option>
                <option value="CHECK_OUT">CHECK_OUT</option>
              </select>
            </Field>
            <Field label="Notes">
              <input className={fieldClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <div className="flex gap-2 sm:col-span-2">
              <ActionButton type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</ActionButton>
              <ActionButton variant="ghost" onClick={() => setShowForm(false)}>Cancel</ActionButton>
            </div>
          </form>
        </Card>
      )}

      {!loading && items.length === 0 && <EmptyBlock message="No attendance records." />}

      {!loading && items.length > 0 && (
        <Table headers={['Student', 'Code', 'Type', 'Time', 'Recorded by', 'Notes']}>
          {items.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-3 font-medium">{a.studentName}</td>
              <td className="px-4 py-3">{a.studentCode || '—'}</td>
              <td className="px-4 py-3">
                <StatusBadge tone={a.type === 'CHECK_IN' ? 'green' : 'amber'}>{a.type}</StatusBadge>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {a.timestamp ? new Date(a.timestamp).toLocaleString() : '—'}
              </td>
              <td className="px-4 py-3">{a.recordedByName || '—'}</td>
              <td className="px-4 py-3">{a.notes || '—'}</td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  )
}
