import { useCallback, useEffect, useState } from 'react'
import { Camera, MapPin, UserRound } from 'lucide-react'
import { apiGet, apiPut } from '../utils/api'
import { getSession, saveSession, getToken } from '../utils/auth'
import { digitsOnly, isTenDigitPhone } from '../utils/phone'
import StudentFeesPanel from '../components/fees/StudentFeesPanel'
import {
  ActionButton,
  Card,
  ErrorBlock,
  Field,
  fieldClass,
  LoadingBlock,
  PageHeader,
  StatusBadge,
} from '../components/ui/Page'

const MAX_PHOTO_BYTES = 1500 * 1024

const emptyForm = {
  fullName: '',
  phone: '',
  aadharNumber: '',
  profilePicture: '',
  addressLine: '',
  city: '',
  state: '',
  pincode: '',
}

function formatAadhar(value) {
  const digits = (value || '').replace(/\D/g, '').slice(0, 12)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

export default function ProfilePage() {
  const session = getSession()
  const isStudent = session?.role === 'STUDENT'
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const applyUser = useCallback((user) => {
    setForm({
      fullName: user?.fullName || '',
      phone: digitsOnly(user?.phone),
      aadharNumber: user?.aadharNumber || '',
      profilePicture: user?.profilePicture || '',
      addressLine: user?.addressLine || '',
      city: user?.city || '',
      state: user?.state || '',
      pincode: user?.pincode || '',
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const user = await apiGet('/api/auth/me')
      applyUser(user)
      const remember = Boolean(localStorage.getItem('hms_token'))
      saveSession({ token: getToken(), user }, remember)
    } catch (err) {
      setError(err.message || 'Failed to load profile')
      applyUser(getSession())
    } finally {
      setLoading(false)
    }
  }, [applyUser])

  useEffect(() => {
    load()
  }, [load])

  const persistProfile = async (nextForm) => {
    const phone = digitsOnly(nextForm.phone)
    if (phone && !isTenDigitPhone(phone)) {
      throw new Error('Phone number must be exactly 10 digits.')
    }
    const updated = await apiPut('/api/users/me/profile', {
      fullName: nextForm.fullName,
      phone: phone || null,
      aadharNumber: nextForm.aadharNumber.replace(/\D/g, '') || null,
      profilePicture: nextForm.profilePicture || null,
      addressLine: nextForm.addressLine,
      city: nextForm.city,
      state: nextForm.state,
      pincode: nextForm.pincode.replace(/\D/g, '') || null,
    })
    const remember = Boolean(localStorage.getItem('hms_token'))
    saveSession({ token: getToken(), user: updated }, remember)
    applyUser(updated)
    return updated
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, or WebP).')
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError('Profile picture must be 1.5 MB or smaller.')
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const profilePicture = String(reader.result)
      const nextForm = { ...form, profilePicture }
      setForm(nextForm)
      setError('')
      setSaving(true)
      try {
        await persistProfile(nextForm)
      } catch (err) {
        setError(err.message || 'Could not save profile picture')
      } finally {
        setSaving(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await persistProfile(form)
      setSuccess('Profile updated successfully.')
    } catch (err) {
      setError(err.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const initials = (form.fullName || session?.email || 'U')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        subtitle={isStudent ? 'Manage your personal, address, and fee details.' : 'Update your personal details.'}
      />

      {error && (
        <div className="mb-4">
          <ErrorBlock message={error} onRetry={load} />
        </div>
      )}
      {success && (
        <Card className="border-emerald-200 dark:border-emerald-900/40">
          <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>
        </Card>
      )}

      {loading && <LoadingBlock />}

      {!loading && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                {form.profilePicture ? (
                  <img
                    src={form.profilePicture}
                    alt="Profile"
                    className="h-28 w-28 rounded-2xl border border-slate-200 object-cover shadow-sm dark:border-slate-700"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-2xl font-bold text-primary dark:from-primary/30 dark:to-primary/10">
                    {initials}
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                  <Camera className="h-4 w-4" aria-hidden="true" />
                  <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
                </label>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{form.fullName || 'Your profile'}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{session?.email}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge tone="teal">{session?.role}</StatusBadge>
                  {session?.studentId && <StatusBadge tone="slate">ID: {session.studentId}</StatusBadge>}
                </div>
                {form.profilePicture && (
                  <button
                    type="button"
                    className="mt-3 text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                    onClick={() => setForm((prev) => ({ ...prev, profilePicture: '' }))}
                  >
                    Remove photo
                  </button>
                )}
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <UserRound className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Personal details</h2>
              </div>
              <div className="space-y-4">
                <Field label="Full name" required>
                  <input
                    className={fieldClass}
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
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
                    placeholder="10-digit mobile number"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: digitsOnly(e.target.value) })}
                  />
                </Field>
                {isStudent && (
                  <Field label="Aadhar card number">
                    <input
                      className={fieldClass}
                      inputMode="numeric"
                      placeholder="1234 5678 9012"
                      value={formatAadhar(form.aadharNumber)}
                      onChange={(e) =>
                        setForm({ ...form, aadharNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })
                      }
                    />
                  </Field>
                )}
              </div>
            </Card>

            {isStudent && (
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Address</h2>
                </div>
                <div className="space-y-4">
                  <Field label="Street / locality">
                    <textarea
                      className={`${fieldClass} min-h-20`}
                      value={form.addressLine}
                      onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
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
                  </div>
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
                </div>
              </Card>
            )}
          </div>

          {isStudent && <StudentFeesPanel />}

          <div>
            <ActionButton type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </ActionButton>
          </div>
        </form>
      )}
    </div>
  )
}
