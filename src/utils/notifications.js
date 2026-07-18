export const NOTIFICATIONS_REFRESH = 'hms:notifications-refresh'

export function refreshNotifications() {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_REFRESH))
}
