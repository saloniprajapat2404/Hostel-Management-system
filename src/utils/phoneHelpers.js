/** Strip to digits and keep at most 10 (Indian mobile without country code). */
export function normalizeMobile10(value) {
  let digits = String(value ?? '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  return digits.slice(0, 10)
}

/** @returns {string|null} Error message, or null if valid / empty. */
export function mobileValidationError(value, label = 'Mobile number') {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return null
  const digits = normalizeMobile10(trimmed)
  if (digits.length !== 10) {
    return `${label} must be exactly 10 digits.`
  }
  if (!/^[6-9]/.test(digits)) {
    return `${label} must start with 6, 7, 8, or 9.`
  }
  return null
}

/** @returns {string|null} Error message, or null if valid. */
export function requiredMobileValidationError(value, label = 'Mobile number') {
  if (!String(value ?? '').trim()) return `${label} is required.`
  return mobileValidationError(value, label)
}

export function validateMobileFields(fields) {
  for (const { value, label } of fields) {
    const err = mobileValidationError(value, label)
    if (err) return err
  }
  return null
}

export function validateRequiredMobileFields(fields) {
  for (const { value, label } of fields) {
    const err = requiredMobileValidationError(value, label)
    if (err) return err
  }
  return null
}

export const mobileInputProps = {
  inputMode: 'numeric',
  maxLength: 10,
  placeholder: '10-digit mobile number',
}
