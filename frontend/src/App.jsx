import { Routes, Route } from 'react-router'
import { RealtimeProvider } from './socket.jsx'
import { ToastProvider } from './components/Toasts.jsx'
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
import { MessagesPage } from './pages/MessagesPage.jsx'
import { NotificationsPage } from './pages/NotificationsPage.jsx'

export function App() {
  return (
    <ToastProvider>
      <RealtimeProvider>
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
            <Route
              path="messages/:userId?"
              element={
                <RequireAuth>
                  <MessagesPage />
                </RequireAuth>
              }
            />
            <Route
              path="notifications"
              element={
                <RequireAuth>
                  <NotificationsPage />
                </RequireAuth>
              }
            />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </RealtimeProvider>
    </ToastProvider>
  )
}
