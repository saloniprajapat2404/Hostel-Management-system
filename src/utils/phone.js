/** Keep only digits, capped at `max` (default 10 for Indian mobile). */
export function digitsOnly(value, max = 10) {
  return String(value || '').replace(/\D/g, '').slice(0, max)
}

export function isTenDigitPhone(value) {
  return /^\d{10}$/.test(String(value || ''))
}
