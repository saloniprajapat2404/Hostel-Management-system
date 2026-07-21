import { useMemo, useState } from 'react'
import { apiPost } from '../utils/api'
import { getSession } from '../utils/auth'
import { digitsOnly, isTenDigitPhone } from '../utils/phone'
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
    value: 'SUPER_ADMIN',
    label: 'Super Admin',
    description: 'Full system access including user and expense management',
  },
  {
    value: 'ADMIN',
    label: 'Admin',
    description: 'Manage hostel operations, rooms, fees, and students',
  },
  {
    value: 'WARDEN',
    label: 'Warden',
    description: 'Manage residents, attendance, complaints, and notices',
  },
  {
    value: 'STUDENT',
    label: 'Student',
    description: 'Register a new hostel student account',
  },
]
const CREATABLE_BY_ROLE = {
  SUPER_ADMIN: ['SUPER_ADMIN', 'ADMIN', 'WARDEN', 'STUDENT'],
  ADMIN: ['ADMIN', 'WARDEN', 'STUDENT'],
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

export default function AddUserPage() {
  const session = getSession()
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

  if (!allowedTypes.length) {
    return <ErrorBlock message="You do not have permission to add users." />
  }

  return (
    <div>
      <PageHeader
        title="Add User"
        subtitle="Create Super Admin, Admin, Warden, or Student accounts based on your role."
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
        <Field label="User type" required>
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
        </Field>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{selected.description}</p>
      </Card>
      <Card>
        <div key={userType} className="motion-safe:animate-[fade-in-up_0.25s_ease-out]">
          <h2 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">
            {selected.label} details
          </h2>
          <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
            Fields marked with <span className="text-red-500">*</span> are mandatory.
          </p>

          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <input
                className={fieldClass}
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Enter full name"
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                className={fieldClass}
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@example.com"
              />
            </Field>
            <Field label="Password" required>
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
            <Field label="Phone No" required>
              <input
                className={fieldClass}
                required
                inputMode="numeric"
                maxLength={10}
                pattern="\d{10}"
                title="Enter exactly 10 digits"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: digitsOnly(e.target.value) })}
                placeholder="10-digit mobile number"
              />
            </Field>
            {userType === 'STUDENT' && (
              <>
                <Field label="Student ID">
                  <input
                    className={fieldClass}
                    value={form.studentId}
                    onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                    placeholder="e.g. STU2024001"
                  />
                </Field>
                <Field label="Aadhar no">
                  <input
                    className={fieldClass}
                    inputMode="numeric"
                    maxLength={14}
                    value={form.aadharNumber.replace(/(\d{4})(?=\d)/g, '$1 ').trim()}
                    onChange={(e) =>
                      setForm({ ...form, aadharNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })
                    }
                    placeholder="XXXX XXXX XXXX"
                  />
                </Field>
                <Field label="Parent mobile no">
                  <input
                    className={fieldClass}
                    inputMode="numeric"
                    maxLength={10}
                    pattern="\d{10}"
                    title="Enter exactly 10 digits"
                    value={form.parentPhone}
                    onChange={(e) => setForm({ ...form, parentPhone: digitsOnly(e.target.value) })}
                    placeholder="10 digits (optional)"
                  />
                </Field>
                <Field label="WhatsApp No" required>
                  <input
                    className={fieldClass}
                    required
                    inputMode="numeric"
                    maxLength={10}
                    pattern="\d{10}"
                    title="Enter exactly 10 digits"
                    value={form.whatsappNumber}
                    onChange={(e) => setForm({ ...form, whatsappNumber: digitsOnly(e.target.value) })}
                    placeholder="10-digit WhatsApp number"
                  />
                </Field>
                <Field label="Address line" className="sm:col-span-2">
                  <input
                    className={fieldClass}
                    value={form.addressLine}
                    onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                    placeholder="Street / hostel block / room"
                  />
                </Field>
                <Field label="City">
                  <input
                    className={fieldClass}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </Field>
                <Field label="State">
                  <input
                    className={fieldClass}
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />
                </Field>
                <Field label="Pincode">
                  <input
                    className={fieldClass}
                    inputMode="numeric"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) =>
                      setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })
                    }
                  />
                </Field>
              </>
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
