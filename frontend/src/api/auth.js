import { api } from './client.js'

export const signup = (data) => api('/auth/signup', { method: 'POST', body: data })
export const login = (data) => api('/auth/login', { method: 'POST', body: data })
export const getMe = () => api('/auth/me')
