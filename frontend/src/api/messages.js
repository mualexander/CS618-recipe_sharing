import { api } from './client.js'

export const listConversations = () => api('/messages')
export const unreadMessageCount = () => api('/messages/unread')
export const getThread = (userId) => api(`/messages/${userId}`)
export const sendMessage = (userId, body) =>
  api(`/messages/${userId}`, { method: 'POST', body: { body } })
export const markThreadRead = (userId) => api(`/messages/${userId}/read`, { method: 'POST' })
