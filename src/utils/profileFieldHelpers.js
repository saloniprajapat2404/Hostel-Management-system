import { mobileValidationError, validateRequiredMobileFields } from './phoneHelpers'

export function aadharValidationError(value, label = 'Aadhar number') {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return `${label} is required.`
  if (digits.length !== 12) return `${label} must be 12 digits.`
  return null
}

export function requiredTextError(value, label) {
  if (!String(value ?? '').trim()) return `${label} is required.`
  return null
}

export function optionalPincodeValidationError(value, label = 'Pincode') {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.length !== 6) return `${label} must be 6 digits.`
  return null
}

/** Validates required phone, parent mobile, Aadhar, and address fields. */
export function validateContactProfileFields(form) {
  const mobileErr = validateRequiredMobileFields([
    { value: form.phone, label: 'Phone' },
    { value: form.parentPhone, label: 'Parent mobile number' },
  ])
  if (mobileErr) return mobileErr

  const whatsappErr = mobileValidationError(form.whatsappNumber, 'WhatsApp number')
  if (whatsappErr) return whatsappErr

  const checks = [
    aadharValidationError(form.aadharNumber),
    requiredTextError(form.addressLine, 'Address line'),
    requiredTextError(form.city, 'City'),
    requiredTextError(form.state, 'State'),
    optionalPincodeValidationError(form.pincode),
  ]
  return checks.find(Boolean) || null
}

/** Validates phone, Aadhar, and address on self-service profile. */
export function validateOwnProfileFields(form) {
  const mobileErr = validateRequiredMobileFields([{ value: form.phone, label: 'Phone' }])
  if (mobileErr) return mobileErr

  const checks = [
    aadharValidationError(form.aadharNumber, 'Aadhar card number'),
    requiredTextError(form.addressLine, 'Street / locality'),
    requiredTextError(form.city, 'City'),
    requiredTextError(form.state, 'State'),
    optionalPincodeValidationError(form.pincode),
  ]
  return checks.find(Boolean) || null
}
