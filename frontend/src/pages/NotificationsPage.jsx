import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listNotifications, markNotificationsRead } from '../api/notifications.js'
import { describeNotification, displayName, timeAgo } from '../lib/format.js'

export function NotificationsPage() {
  const queryClient = useQueryClient()
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
  })

  const markRead = useMutation({
    mutationFn: () => markNotificationsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications-unread'] }),
  })

  // Highlight what was new when the page opened, then mark everything read.
  // New arrivals while the page is open are highlighted too.
  const [fresh, setFresh] = useState(() => new Set())
  const unreadIds = data?.filter((n) => !n.readAt).map((n) => n._id) ?? []
  const unreadKey = unreadIds.join(',')
  useEffect(() => {
    if (!unreadKey) return
    setFresh((prev) => new Set([...prev, ...unreadKey.split(',')]))
    markRead.mutate()
  }, [unreadKey]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="narrow">
      <h1>Notifications</h1>
      {isPending && <p className="muted">Loading…</p>}
      {isError && <p className="error">{error.message}</p>}
      {data?.length === 0 && (
        <div className="empty">
          <p>
            No notifications yet. When people like, rate, or comment on your recipes, you’ll see it
            here.
          </p>
        </div>
      )}
      <ul className="notification-list">
        {data?.map((n) => (
          <li key={n._id} className={`notification${fresh.has(n._id) ? ' unread' : ''}`}>
            <Link to={n.recipe ? `/recipes/${n.recipe._id}` : '#'} className="notification-link">
              <span className={`notification-icon ${n.type}`} aria-hidden="true">
                {n.type === 'like' ? '♥' : n.type === 'rating' ? '★' : '💬'}
              </span>
              <span className="notification-text">
                <span>
                  <strong>{displayName(n.actor)}</strong> {describeNotification(n)}
                </span>
                {n.excerpt && <span className="muted excerpt">“{n.excerpt}”</span>}
                <span className="muted small">{timeAgo(n.createdAt)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
