import { api } from './client.js'

export const getUser = (id) => api(`/users/${id}`)
