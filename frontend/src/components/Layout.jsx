import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext.jsx'
import { unreadMessageCount } from '../api/messages.js'
import { unreadNotificationCount } from '../api/notifications.js'

// Unread counts stay current through socket events (which invalidate
// these queries); the interval is only a fallback after reconnects.
function useUnread(key, fn, enabled) {
  const { data } = useQuery({
    queryKey: [key],
    queryFn: fn,
    enabled,
    refetchInterval: 60_000,
  })
  return enabled ? (data?.count ?? 0) : 0
}

const Badge = ({ count, label }) =>
  count > 0 ? (
    <span className="badge" aria-label={`${count} unread ${label}`}>
      {count > 99 ? '99+' : count}
    </span>
  ) : null

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const unreadMessages = useUnread('messages-unread', unreadMessageCount, Boolean(user))
  const unreadNotifications = useUnread(
    'notifications-unread',
    unreadNotificationCount,
    Boolean(user),
  )

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <>
      <header className="site-header">
        <nav className="container nav">
          <Link to="/" className="brand">
            Recipe Sharing
          </Link>
          <div className="nav-links">
            <NavLink to="/" end>
              Recipes
            </NavLink>
            {user ? (
              <>
                <NavLink to="/recipes/new">New recipe</NavLink>
                <NavLink to={`/users/${user.id}`}>My recipes</NavLink>
                <NavLink to="/messages" className="with-badge">
                  Messages <Badge count={unreadMessages} label="messages" />
                </NavLink>
                <NavLink to="/notifications" className="with-badge" aria-label="Notifications">
                  <span aria-hidden="true">🔔</span>
                  <Badge count={unreadNotifications} label="notifications" />
                </NavLink>
                <span className="muted nav-user">@{user.username}</span>
                <button className="link-button" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login">Log in</NavLink>
                <Link to="/signup" className="button small">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main className="container page">
        <Outlet />
      </main>
    </>
  )
}
