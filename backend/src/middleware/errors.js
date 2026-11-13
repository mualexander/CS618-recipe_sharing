export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

export const notFound = (what = 'resource') => new HttpError(404, `${what} not found`)
export const forbidden = (message = 'you can only modify your own content') =>
  new HttpError(403, message)

// Converts known error types into consistent JSON responses:
// { error: string, fields?: { [path]: message } }
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)

  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, fields: err.fields })
  }
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'authentication required' })
  }
  if (err.name === 'ValidationError') {
    const fields = Object.fromEntries(
      Object.entries(err.errors).map(([path, e]) => [path, e.message]),
    )
    return res.status(400).json({ error: 'validation failed', fields })
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `invalid ${err.path}` })
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'value'
    return res
      .status(409)
      .json({ error: `${field} already exists`, fields: { [field]: `${field} is taken` } })
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'invalid JSON body' })
  }

  console.error(err)
  res.status(500).json({ error: 'internal server error' })
}
