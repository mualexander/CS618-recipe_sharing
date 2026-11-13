import { api } from './client.js'

export const listNotifications = () => api('/notifications')
export const unreadNotificationCount = () => api('/notifications/unread')
export const markNotificationsRead = (ids) =>
  api('/notifications/read', { method: 'POST', body: ids ? { ids } : {} })
