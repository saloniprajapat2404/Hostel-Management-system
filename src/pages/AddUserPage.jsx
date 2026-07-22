import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Crown,
  GraduationCap,
  LayoutGrid,
  MapPin,
  Shield,
  UserCog,
  UserPlus,
} from 'lucide-react'
import { apiPost } from '../utils/api'
import { getSession } from '../utils/auth'
import { mobileInputProps, normalizeMobile10 } from '../utils/phoneHelpers'
import { validateContactProfileFields } from '../utils/profileFieldHelpers'
import { createDefaultScreenPermissions } from '../constants/screenPermissions'
import OnOffToggle from '../components/ui/OnOffToggle'
import ScreenPermissionsSection from '../components/users/ScreenPermissionsSection'
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
    description: 'Full system access including expenses, all users, and settings',
    icon: Crown,
    tone: 'amber',
  },
  {
    value: 'ADMIN',
    label: 'Admin',
    description: 'Manage hostel operations, rooms, fees, and students',
    icon: Shield,
    tone: 'violet',
  },
  {
    value: 'WARDEN',
    label: 'Warden',
    description: 'Manage residents, attendance, complaints, and notices',
    icon: UserCog,
    tone: 'blue',
  },
  {
    value: 'STUDENT',
    label: 'Student',
    description: 'Register a new hostel student with contact and address details',
    icon: GraduationCap,
    tone: 'teal',
  },
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

const inputClass = `${fieldClass} add-user-input transition-all duration-200`

function createUserHeading(userType) {
  if (userType === 'SUPER_ADMIN') return 'Create Super Admin'
  if (userType === 'ADMIN') return 'Create Admin'
  if (userType === 'WARDEN') return 'Create Warden'
  if (userType === 'STUDENT') return 'Create Student'
  return 'Create User'
}

function createUserButtonLabel(userType, saving) {
  if (saving) return 'Creating…'
  return createUserHeading(userType)
}

function FormSection({ icon: Icon, title, subtitle, children }) {
  return (
    <section className="add-user-section">
      <div className="add-user-section-head">
        <span className="add-user-section-icon" aria-hidden="true">
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export default function AddUserPage() {
  const session = getSession()
  const isSuperAdmin = session?.role === 'SUPER_ADMIN'
  const canToggleActive = session?.role === 'SUPER_ADMIN' || session?.role === 'ADMIN'
  const allowedTypes = useMemo(
    () => USER_TYPES.filter((type) => CREATABLE_BY_ROLE[session?.role]?.includes(type.value)),
    [session?.role],
  )
  const [userType, setUserType] = useState(() => allowedTypes[0]?.value || 'STUDENT')
  const [form, setForm] = useState(emptyForm)
  const [screenPermissions, setScreenPermissions] = useState(createDefaultScreenPermissions)
  const [accessGrant, setAccessGrant] = useState(true)
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
        screenPermissions,
        accessGrant,
      })
      setSuccess(
        `${selected.label} created successfully${form.active ? '' : ' (inactive — cannot sign in)'}.`,
      )
      setForm(emptyForm)
      setScreenPermissions(createDefaultScreenPermissions())
      setAccessGrant(true)
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
    <div className="add-user-page mx-auto max-w-4xl motion-safe:animate-[fade-in-up_0.35s_ease-out]">
      <PageHeader title="Add User" />

      {error && (
        <div className="mb-4">
          <ErrorBlock message={error} />
        </div>
      )}

      {success && (
        <div className="add-user-success mb-5 flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/90 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/40">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div>
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">{success}</p>
            <p className="mt-0.5 text-xs text-emerald-700/80 dark:text-emerald-300/80">
              The new account is ready to sign in.
            </p>
          </div>
        </div>
      )}

      {!isSuperAdmin && (
        <Card className="add-user-card mb-5 overflow-hidden p-0">
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {allowedTypes.map((type) => {
              const Icon = type.icon
              const active = userType === type.value
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeChange(type.value)}
                  aria-pressed={active}
                  className={[
                    'add-user-role-card group text-left',
                    active ? 'add-user-role-card-active' : '',
                    `add-user-role-${type.tone}`,
                  ].join(' ')}
                >
                  <span className="add-user-role-icon" aria-hidden="true">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="mt-3 block text-sm font-semibold text-slate-900 dark:text-white">
                    {type.label}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {type.description}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      <Card className="add-user-card overflow-hidden p-0">
        <div className="border-b border-slate-200/80 bg-slate-50/80 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light">
                <UserPlus className="h-5 w-5" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {createUserHeading(userType)}
                </h2>
                {isSuperAdmin && selected?.description && (
                  <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {selected.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 sm:justify-end">
              <OnOffToggle
                id="add-user-active-toggle"
                label="Account status"
                checked={form.active !== false}
                canToggle={canToggleActive}
                onChange={(next) => setForm({ ...form, active: next })}
                className="sm:items-end"
              />
            </div>
          </div>
          {isSuperAdmin && (
            <div className="mt-4 max-w-xs">
              <Field label="User type" required>
                <select
                  className={inputClass}
                  required
                  value={userType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                >
                  {allowedTypes.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </div>

        <form
          key={userType}
          onSubmit={handleSubmit}
          className="space-y-8 p-5 motion-safe:animate-[fade-in-up_0.25s_ease-out]"
        >
          <FormSection
            icon={selected.icon}
            title="Account credentials"
            subtitle="Login details for the new user"
          >
            <Field label="Full name" required>
              <input
                className={inputClass}
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Enter full name"
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                className={inputClass}
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@example.com"
              />
            </Field>
            <Field label="Password" required>
              <input
                type="password"
                className={inputClass}
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
            </Field>
            <Field label="Phone" required>
              <input
                className={inputClass}
                required
                {...mobileInputProps}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: normalizeMobile10(e.target.value) })}
              />
            </Field>
          </FormSection>

          <FormSection
            icon={selected.icon}
            title="Identity & contact"
            subtitle="Verification and emergency contact details"
          >
            {userType === 'STUDENT' && (
              <Field label="Student ID">
                <input
                  className={inputClass}
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  placeholder="e.g. STU2024001"
                />
              </Field>
            )}
            <Field label="Aadhar no" required>
              <input
                className={inputClass}
                required
                inputMode="numeric"
                maxLength={14}
                value={form.aadharNumber.replace(/(\d{4})(?=\d)/g, '$1 ').trim()}
                onChange={(e) =>
                  setForm({ ...form, aadharNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })
                }
                placeholder="XXXX XXXX XXXX"
              />
            </Field>
            <Field label="Parent mobile no" required>
              <input
                className={inputClass}
                required
                {...mobileInputProps}
                value={form.parentPhone}
                onChange={(e) =>
                  setForm({ ...form, parentPhone: normalizeMobile10(e.target.value) })
                }
              />
            </Field>
            <Field label="WhatsApp number">
              <input
                className={inputClass}
                {...mobileInputProps}
                value={form.whatsappNumber}
                onChange={(e) =>
                  setForm({ ...form, whatsappNumber: normalizeMobile10(e.target.value) })
                }
                placeholder="10-digit number for notice alerts"
              />
            </Field>
          </FormSection>

          <FormSection
            icon={MapPin}
            title="Address"
            subtitle="Contact address for records"
          >
            <div className="sm:col-span-2">
              <Field label="Address line" required>
                <input
                  className={inputClass}
                  required
                  value={form.addressLine}
                  onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                  placeholder="Street / locality / hostel block"
                />
              </Field>
            </div>
            <Field label="City" required>
              <input
                className={inputClass}
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="City"
              />
            </Field>
            <Field label="State" required>
              <input
                className={inputClass}
                required
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                placeholder="State"
              />
            </Field>
            <Field label="Pincode">
              <input
                className={inputClass}
                inputMode="numeric"
                maxLength={6}
                value={form.pincode}
                onChange={(e) =>
                  setForm({ ...form, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })
                }
                placeholder="6-digit pincode"
              />
            </Field>
          </FormSection>

          <ScreenPermissionsSection
            permissions={screenPermissions}
            accessGrant={accessGrant}
            onPermissionChange={(key, enabled) =>
              setScreenPermissions((prev) => ({ ...prev, [key]: enabled }))
            }
            onAccessGrantChange={setAccessGrant}
          />

          <div className="add-user-actions flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-5 dark:border-slate-800">
            <ActionButton type="submit" disabled={saving} className="min-w-[160px] shadow-md shadow-primary/20">
              {createUserButtonLabel(userType, saving)}
            </ActionButton>
            <ActionButton
              type="button"
              variant="ghost"
              onClick={() => {
                setForm(emptyForm)
                setScreenPermissions(createDefaultScreenPermissions())
                setAccessGrant(true)
                setError('')
                setSuccess('')
              }}
            >
              Clear form
            </ActionButton>
          </div>
        </form>
      </Card>
    </div>
  )
}
