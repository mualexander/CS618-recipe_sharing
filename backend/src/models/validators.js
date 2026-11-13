export const httpUrl = {
  validator: (v) => {
    if (!v) return true
    try {
      const url = new URL(v)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  },
  message: 'must be a valid http(s) URL',
}
