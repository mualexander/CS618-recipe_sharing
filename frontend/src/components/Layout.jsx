import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext.jsx'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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
