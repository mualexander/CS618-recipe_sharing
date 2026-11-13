export const displayName = (user) =>
  user?.displayName || (user?.username ? `@${user.username}` : 'Someone')

// "just now", "5m", "3h", "2d", then a short date.
export function timeAgo(date) {
  const seconds = Math.round((Date.now() - new Date(date)) / 1000)
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export function describeNotification(n) {
  const title = n.recipe?.title ?? 'a deleted recipe'
  switch (n.type) {
    case 'like':
      return `liked your recipe “${title}”`
    case 'rating':
      return `rated “${title}” ${'★'.repeat(n.value ?? 0)}`
    case 'comment':
      return `commented on “${title}”`
    default:
      return `interacted with “${title}”`
  }
}
