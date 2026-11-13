import { Routes, Route } from 'react-router'
import { useRealtime } from './socket.js'
import { RequireAuth } from './auth/RequireAuth.jsx'
import { Layout } from './components/Layout.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { RecipePage } from './pages/RecipePage.jsx'
import { NewRecipePage } from './pages/NewRecipePage.jsx'
import { EditRecipePage } from './pages/EditRecipePage.jsx'
import { UserPage } from './pages/UserPage.jsx'
import { LoginPage } from './pages/LoginPage.jsx'
import { SignupPage } from './pages/SignupPage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'

export function App() {
  useRealtime()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="recipes/:id" element={<RecipePage />} />
        <Route
          path="recipes/new"
          element={
            <RequireAuth>
              <NewRecipePage />
            </RequireAuth>
          }
        />
        <Route
          path="recipes/:id/edit"
          element={
            <RequireAuth>
              <EditRecipePage />
            </RequireAuth>
          }
        />
        <Route path="users/:id" element={<UserPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
