import { getStoredToken } from '../auth/tokenStorage.js'

export class ApiError extends Error {
  constructor(status, message, fields) {
    super(message)
    this.status = status
    this.fields = fields ?? {}
  }
}

// JSON fetch wrapper: attaches the auth token and normalizes errors into
// ApiError { status, message, fields } so forms can show per-field messages.
export async function api(path, { method = 'GET', body, query } = {}) {
  const url = new URL(`/api/v1${path}`, window.location.origin)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
    }
  }

  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getStoredToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(res.status, data.error || `request failed (${res.status})`, data.fields)
  return data
}
