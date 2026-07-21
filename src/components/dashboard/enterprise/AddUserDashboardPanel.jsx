import { useMemo, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { apiPost } from '../../../utils/api'
import { getSession } from '../../../utils/auth'
import { digitsOnly, isTenDigitPhone } from '../../../utils/phone'
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
  whatsappNumber: '',
  aadharNumber: '',
  addressLine: '',
  city: '',
  state: '',
  pincode: '',
  parentPhone: '',
}

function RequiredMark() {
  return (
    <span className="ml-0.5 font-semibold text-red-600 dark:text-red-400" aria-hidden="true">
      *
    </span>
  )
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

  const buildStudentBody = () => ({
    aadharNumber: form.aadharNumber.replace(/\D/g, '') || null,
    addressLine: form.addressLine.trim() || null,
    city: form.city.trim() || null,
    state: form.state.trim() || null,
    pincode: form.pincode.replace(/\D/g, '') || null,
    parentPhone: form.parentPhone || null,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const phone = digitsOnly(form.phone)
    const whatsappNumber = digitsOnly(form.whatsappNumber)
    const parentPhone = digitsOnly(form.parentPhone)

    if (!isTenDigitPhone(phone)) {
      setError('Phone number must be exactly 10 digits.')
      setSaving(false)
      return
    }
    if (userType === 'STUDENT' && !isTenDigitPhone(whatsappNumber)) {
      setError('WhatsApp number must be exactly 10 digits.')
      setSaving(false)
      return
    }
    if (userType === 'STUDENT' && parentPhone && !isTenDigitPhone(parentPhone)) {
      setError('Parent mobile number must be exactly 10 digits.')
      setSaving(false)
      return
    }

    try {
      await apiPost('/api/users', {
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        role: userType,
        studentId: userType === 'STUDENT' ? form.studentId.trim() || null : null,
        phone,
        whatsappNumber: userType === 'STUDENT' ? whatsappNumber : null,
        active: canToggleActive ? Boolean(form.active) : true,
        ...(userType === 'STUDENT' ? { ...buildStudentBody(), parentPhone: parentPhone || null } : {}),
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
            <p className="text-[12px] text-[var(--dash-muted)]">
              Fields marked with <span className="text-red-500">*</span> are mandatory
            </p>
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

      <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
        <div className="min-w-0">
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[var(--dash-muted)]">
            User type
            <RequiredMark />
          </label>
          <select
            className={fieldClass}
            value={userType}
            onChange={(e) => handleTypeChange(e.target.value)}
            aria-label="User type"
            required
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
          Full name
          <RequiredMark />
          <input
            className={`${fieldClass} mt-1`}
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="Enter full name"
          />
        </label>
        <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
          Email
          <RequiredMark />
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
          Password
          <RequiredMark />
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
          Phone No
          <RequiredMark />
          <input
            className={`${fieldClass} mt-1`}
            required
            inputMode="numeric"
            maxLength={10}
            pattern="\d{10}"
            title="Enter exactly 10 digits"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: digitsOnly(e.target.value) })}
            placeholder="10-digit mobile number"
          />
        </label>
        {userType === 'STUDENT' && (
          <>
            <label className="block text-[12px] font-medium text-[var(--dash-muted)] sm:col-span-2">
              Student ID
              <input
                className={`${fieldClass} mt-1`}
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                placeholder="e.g. STU2024001"
              />
            </label>
            <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
              Aadhar no
              <input
                className={`${fieldClass} mt-1`}
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
              Parent mobile no
              <input
                className={`${fieldClass} mt-1`}
                inputMode="numeric"
                maxLength={10}
                pattern="\d{10}"
                title="Enter exactly 10 digits"
                value={form.parentPhone}
                onChange={(e) => setForm({ ...form, parentPhone: digitsOnly(e.target.value) })}
                placeholder="10 digits (optional)"
              />
            </label>
            <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
              WhatsApp No
              <RequiredMark />
              <input
                className={`${fieldClass} mt-1`}
                required
                inputMode="numeric"
                maxLength={10}
                pattern="\d{10}"
                title="Enter exactly 10 digits"
                value={form.whatsappNumber}
                onChange={(e) => setForm({ ...form, whatsappNumber: digitsOnly(e.target.value) })}
                placeholder="10-digit WhatsApp number"
              />
            </label>
            <label className="block text-[12px] font-medium text-[var(--dash-muted)] sm:col-span-2">
              Address line
              <input
                className={`${fieldClass} mt-1`}
                value={form.addressLine}
                onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                placeholder="Street / hostel block / room"
              />
            </label>
            <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
              City
              <input
                className={`${fieldClass} mt-1`}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </label>
            <label className="block text-[12px] font-medium text-[var(--dash-muted)]">
              State
              <input
                className={`${fieldClass} mt-1`}
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
          </>
        )}
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-[10px] bg-[#3B82F6] px-4 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? 'Registering…' : `Register ${selected.label}`}
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
