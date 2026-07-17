import { useState } from 'react'
import { GraduationCap, Shield } from 'lucide-react'
import { apiPost } from '../utils/api'
import {
  ActionButton,
  Card,
  ErrorBlock,
  Field,
  fieldClass,
  PageHeader,
} from '../components/ui/Page'

const USER_TYPES = [
  {
    value: 'STUDENT',
    label: 'Student',
    description: 'Register a new hostel student account',
    icon: GraduationCap,
  },
  {
    value: 'WARDEN',
    label: 'Warden',
    description: 'Register a warden with hostel management access',
    icon: Shield,
  },
]

const emptyForm = {
  email: '',
  password: '',
  fullName: '',
  studentId: '',
  phone: '',
}

export default function AddUserPage() {
  const [userType, setUserType] = useState('STUDENT')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selected = USER_TYPES.find((t) => t.value === userType) || USER_TYPES[0]

  const handleTypeChange = (nextType) => {
    if (nextType === userType) return
    setUserType(nextType)
    setError('')
    setSuccess('')
    if (nextType === 'WARDEN') {
      setForm((prev) => ({ ...prev, studentId: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await apiPost('/api/users', {
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        role: userType,
        studentId: userType === 'STUDENT' ? form.studentId.trim() || null : null,
        phone: form.phone.trim() || null,
      })
      setSuccess(`${selected.label} registered successfully.`)
      setForm(emptyForm)
    } catch (err) {
      setError(err.message || 'Registration failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Add User"
        subtitle="Create a new student or warden account from one place."
      />

      {error && (
        <div className="mb-4">
          <ErrorBlock message={error} />
        </div>
      )}

      {success && (
        <Card className="mb-4 border-emerald-200 dark:border-emerald-900/40">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>
        </Card>
      )}

      <Card className="mb-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          User type
        </p>
        <div
          className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-700 dark:bg-slate-800/60 sm:max-w-lg"
          role="tablist"
          aria-label="User type"
        >
          {USER_TYPES.map(({ value, label, icon: Icon }) => {
            const active = userType === value
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleTypeChange(value)}
                className={[
                  'flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200',
                  active
                    ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/80 dark:bg-slate-900 dark:text-white dark:shadow-none'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
                {label}
              </button>
            )
          })}
        </div>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{selected.description}</p>
      </Card>

      <Card>
        <div
          key={userType}
          className="motion-safe:animate-[fade-in-up_0.25s_ease-out]"
        >
          <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
            {selected.label} details
          </h2>
          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
            Fill in the account information below.
          </p>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input
                className={fieldClass}
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Enter full name"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className={fieldClass}
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@example.com"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                className={fieldClass}
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
            </Field>
            <Field label="Phone">
              <input
                className={fieldClass}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Optional"
              />
            </Field>
            {userType === 'STUDENT' && (
              <Field label="Student ID">
                <input
                  className={fieldClass}
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  placeholder="e.g. STU2024001"
                />
              </Field>
            )}
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <ActionButton type="submit" disabled={saving}>
                {saving ? 'Registering…' : `Register ${selected.label}`}
              </ActionButton>
              <ActionButton
                type="button"
                variant="ghost"
                onClick={() => {
                  setForm(emptyForm)
                  setError('')
                  setSuccess('')
                }}
              >
                Clear form
              </ActionButton>
            </div>
          </form>
        </div>
      </Card>
    </div>
  )
}
