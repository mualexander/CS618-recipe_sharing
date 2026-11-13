import { api } from './client.js'

export const getUser = (id) => api(`/users/${id}`)
export const searchUsers = (q) => api('/users', { query: { q, limit: 8 } })
