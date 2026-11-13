import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Link } from 'react-router'

const ToastContext = createContext(() => {})
const DURATION_MS = 6000

// Small stack of transient alerts in the corner, used for live
// notifications and incoming messages.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismiss = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), [])

  const show = useCallback(
    (toast) => {
      const id = ++nextId.current
      setToasts((all) => [...all.slice(-3), { ...toast, id }])
      setTimeout(() => dismiss(id), DURATION_MS)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <Link to={t.to} className="toast-body" onClick={() => dismiss(t.id)}>
              <strong>{t.title}</strong>
              {t.body && <span>{t.body}</span>}
            </Link>
            <button
              type="button"
              className="icon toast-close"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
