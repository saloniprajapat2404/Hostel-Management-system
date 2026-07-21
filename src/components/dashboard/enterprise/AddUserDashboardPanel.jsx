import { useMemo, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { apiPost } from '../../../utils/api'
import { getSession } from '../../../utils/auth'
import { mobileInputProps, normalizeMobile10 } from '../../../utils/phoneHelpers'
import { validateContactProfileFields } from '../../../utils/profileFieldHelpers'
import { fieldClass } from '../../ui/Page'
import OnOffToggle from '../../ui/OnOffToggle'

const USER_TYPES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'WARDEN', label: 'Warden' },
  { value: 'STUDENT', label: 'Student' },
]
const CREATABLE_BY_ROLE = {
  SUPER_ADMIN: ['SUPER_ADMIN', 'ADMIN', 'WARDEN', 'STUDENT'],
  ADMIN: ['WARDEN', 'STUDENT'],
}

const emptyForm = {
  email: '',
  password: '',
  fullName: '',
  studentId: '',
  phone: '',
  whatsappNumber: '',
  aadharNumber: '',
  addressLine: '',
  city: '',
  state: '',
  pincode: '',
  parentPhone: '',
  active: true,
}

const studentOnlyFields = {
  studentId: '',
}

const buildProfileBody = (form) => ({
  aadharNumber: form.aadharNumber.replace(/\D/g, '') || null,
  addressLine: form.addressLine.trim() || null,
  city: form.city.trim() || null,
  state: form.state.trim() || null,
  pincode: form.pincode.replace(/\D/g, '') || null,
  parentPhone: normalizeMobile10(form.parentPhone) || null,
  whatsappNumber: normalizeMobile10(form.whatsappNumber) || null,
})

function createUserButtonLabel(userType, saving) {
  if (saving) return 'Creating…'
  if (userType === 'SUPER_ADMIN') return 'Create Super Admin'
  if (userType === 'ADMIN') return 'Create Admin'
  if (userType === 'WARDEN') return 'Create Warden'
  if (userType === 'STUDENT') return 'Create Student'
  return 'Create User'
}

export default function AddUserDashboardPanel({ open, onClose }) {
  const session = getSession()
  const canToggleActive = session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN'
  const allowedTypes = useMemo(
    () => USER_TYPES.filter((type) => CREATABLE_BY_ROLE[session?.role]?.includes(type.value)),
    [session?.role],
  )
  const [userType, setUserType] = useState(() => allowedTypes[0]?.value || 'STUDENT')
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selected = allowedTypes.find((type) => type.value === userType) || allowedTypes[0]

  if (!open || !allowedTypes.length) return null

  const handleTypeChange = (nextType) => {
    if (nextType === userType) return
    setUserType(nextType)
    setError('')
    setSuccess('')
    if (nextType !== 'STUDENT') {
      setForm((prev) => ({ ...prev, ...studentOnlyFields }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErr = validateContactProfileFields(form)
    if (validationErr) {
      setError(validationErr)
      return
    }
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
        phone: normalizeMobile10(form.phone) || null,
        active: canToggleActive ? Boolean(form.active) : true,
        ...buildProfileBody(form),
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
    <section id="dashboard-add-user" className="dashboard-surface-card overflow-hidden p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-[10px]"
            style={{ background: 'color-mix(in srgb, #3B82F6 15%, transparent)', color: '#3B82F6' }}
          >
            <UserPlus className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--dash-text)]">Add user</h3>
            <p className="text-[12px] text-[var(--dash-muted)]">Choose role and register from dashboard</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-[12px] font-medium text-[var(--dash-muted)] transition-colors hover:bg-[var(--dash-hover)] hover:text-[var(--dash-text)]"
        >
          Close
        </button>
      </div>

      <div className="mb-3 grid gap-3 sm:grid-cols-2 sm:items-start">
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
            User type <span className="text-red-500">*</span>
          </label>
          <select
            className={fieldClass}
            value={userType}
            onChange={(e) => handleTypeChange(e.target.value)}
            aria-label="User type"
          >
            {allowedTypes.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex sm:justify-end">
          <OnOffToggle
            id="dashboard-add-user-active-toggle"
            label="Account status"
            checked={form.active !== false}
            canToggle={canToggleActive}
            onChange={(next) => setForm({ ...form, active: next })}
            className="sm:items-end"
          />
        </div>
      </div>
      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          {success}
        </p>
      )}

      <form key={userType} onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
          Full name <span className="text-red-500">*</span>
          <input
            className={`${fieldClass} mt-1`}
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="Enter full name"
          />
        </label>
        <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
          Email <span className="text-red-500">*</span>
          <input
            type="email"
            className={`${fieldClass} mt-1`}
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="name@example.com"
          />
        </label>
        <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
          Password <span className="text-red-500">*</span>
          <input
            type="password"
            className={`${fieldClass} mt-1`}
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Minimum 6 characters"
          />
        </label>
        <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
          Phone <span className="text-red-500">*</span>
          <input
            className={`${fieldClass} mt-1`}
            required
            {...mobileInputProps}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: normalizeMobile10(e.target.value) })}
          />
        </label>
        {userType === 'STUDENT' && (
          <label className="block text-[12px] font-medium text-[var(--dash-muted)] sm:col-span-2">
            Student ID
            <input
              className={`${fieldClass} mt-1`}
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              placeholder="e.g. STU2024001"
            />
          </label>
        )}
        <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
          Aadhar no <span className="text-red-500">*</span>
          <input
            className={`${fieldClass} mt-1`}
            required
            inputMode="numeric"
            maxLength={14}
            value={form.aadharNumber.replace(/(\d{4})(?=\d)/g, '$1 ').trim()}
            onChange={(e) =>
              setForm({ ...form, aadharNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })
            }
            placeholder="XXXX XXXX XXXX"
          />
        </label>
        <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
          Parent mobile no <span className="text-red-500">*</span>
          <input
            className={`${fieldClass} mt-1`}
            required
            {...mobileInputProps}
            value={form.parentPhone}
            onChange={(e) =>
              setForm({ ...form, parentPhone: normalizeMobile10(e.target.value) })
            }
          />
        </label>
        <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
          WhatsApp number
          <input
            className={`${fieldClass} mt-1`}
            {...mobileInputProps}
            value={form.whatsappNumber}
            onChange={(e) =>
              setForm({ ...form, whatsappNumber: normalizeMobile10(e.target.value) })
            }
            placeholder="10-digit number for notice alerts"
          />
        </label>
        <label className="block text-[12px] font-medium text-[var(--dash-muted)] sm:col-span-2">
          Address line <span className="text-red-500">*</span>
          <input
            className={`${fieldClass} mt-1`}
            required
            value={form.addressLine}
            onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
            placeholder="Street / hostel block / room"
          />
        </label>
        <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
          City <span className="text-red-500">*</span>
          <input
            className={`${fieldClass} mt-1`}
            required
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </label>
        <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
          State <span className="text-red-500">*</span>
          <input
            className={`${fieldClass} mt-1`}
            required
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
          />
        </label>
        <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
          Pincode
          <input
            className={`${fieldClass} mt-1`}
            inputMode="numeric"
            maxLength={6}
            value={form.pincode}
            onChange={(e) =>
              setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })
            }
          />
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-[10px] bg-[#3B82F6] px-4 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {createUserButtonLabel(userType, saving)}
          </button>
          <button
            type="button"
            onClick={() => {
              setForm(emptyForm)
              setError('')
              setSuccess('')
            }}
            className="rounded-[10px] border px-4 py-2 text-[12px] font-medium text-[var(--dash-muted)] transition-colors hover:bg-[var(--dash-hover)]"
            style={{ borderColor: 'var(--dash-border-subtle)' }}
          >
            Clear
          </button>
        </div>
      </form>
    </section>
  )
}
