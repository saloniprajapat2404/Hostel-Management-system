import { useState } from 'react'
import { apiPut } from '../utils/api'
import { getSession, saveSession, getToken } from '../utils/auth'
import {
  ActionButton,
  Card,
  ErrorBlock,
  Field,
  fieldClass,
  PageHeader,
} from '../components/ui/Page'

export default function ProfilePage() {
  const session = getSession()
  const [fullName, setFullName] = useState(session?.fullName || '')
  const [phone, setPhone] = useState(session?.phone || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await apiPut('/api/users/me/profile', { fullName, phone })
      const remember = Boolean(localStorage.getItem('hms_token'))
      saveSession({ token: getToken(), user: updated }, remember)
      setSuccess('Profile updated.')
    } catch (err) {
      setError(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Profile" subtitle="Update your personal details." />

      {error && <div className="mb-4"><ErrorBlock message={error} /></div>}
      {success && (
        <Card className="mb-4 border-emerald-200 dark:border-emerald-900/40">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>
        </Card>
      )}

      <Card className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Email">
            <input className={fieldClass} value={session?.email || ''} disabled />
          </Field>
          <Field label="Role">
            <input className={fieldClass} value={session?.role || ''} disabled />
          </Field>
          {session?.studentId && (
            <Field label="Student ID">
              <input className={fieldClass} value={session.studentId} disabled />
            </Field>
          )}
          <Field label="Full name">
            <input
              className={fieldClass}
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input
              className={fieldClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <ActionButton type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </ActionButton>
        </form>
      </Card>
    </div>
  )
}
