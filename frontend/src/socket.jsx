import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './auth/AuthContext.jsx'
import { useToast } from './components/Toasts.jsx'
import { describeNotification, displayName } from './lib/format.js'

const SocketContext = createContext(null)

// Patches a recipe's counters everywhere it is cached (detail page and any
// feed page) without refetching.
function applyStats(queryClient, recipeId, stats) {
  const id = String(recipeId)
  queryClient.setQueryData(['recipe', id], (old) => (old ? { ...old, stats } : old))
  queryClient.setQueriesData({ queryKey: ['recipes'] }, (old) =>
    old?.items
      ? {
          ...old,
          items: old.items.map((r) => (r._id === id ? { ...r, stats } : r)),
        }
      : old,
  )
}

// Opens one Socket.IO connection per session (same origin; Vite and nginx
// proxy /socket.io to the backend) and keeps cached data fresh as other
// people create recipes, like, rate, and comment.
export function RealtimeProvider({ children }) {
  const { token, user } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [socket, setSocket] = useState(null)

  // Read inside socket handlers without reconnecting on every navigation.
  const { pathname } = useLocation()
  const pathRef = useRef(pathname)
  pathRef.current = pathname
  const userId = user?.id

  useEffect(() => {
    const s = io({ auth: token ? { token } : {} })

    const refreshLists = () => queryClient.invalidateQueries({ queryKey: ['recipes'] })
    const refreshOne = ({ recipeId }) => {
      refreshLists()
      queryClient.invalidateQueries({ queryKey: ['recipe', String(recipeId)] })
    }

    s.on('recipe:created', refreshLists)
    s.on('recipe:updated', refreshOne)
    s.on('recipe:deleted', refreshOne)
    s.on('recipe:stats', ({ recipeId, stats }) => applyStats(queryClient, recipeId, stats))

    s.on('comment:created', ({ recipeId, comment }) => {
      queryClient.setQueryData(['comments', String(recipeId)], (old) =>
        old && !old.some((c) => c._id === comment._id) ? [comment, ...old] : old,
      )
    })
    s.on('comment:deleted', ({ recipeId, commentId }) => {
      queryClient.setQueryData(['comments', String(recipeId)], (old) =>
        old?.filter((c) => c._id !== String(commentId)),
      )
    })

    // --- private events (only sent to signed-in users) ---

    const refreshInbox = () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['messages-unread'] })
    }

    s.on('message:new', ({ message, sender }) => {
      const otherId = message.from === userId ? message.to : message.from
      queryClient.setQueryData(['thread', otherId], (old) =>
        old && !old.messages.some((m) => m._id === message._id)
          ? { ...old, messages: [...old.messages, message] }
          : old,
      )
      refreshInbox()
      const incoming = message.from !== userId
      if (incoming && pathRef.current !== `/messages/${otherId}`) {
        toast({
          title: `New message from ${displayName(sender)}`,
          body: message.body.length > 80 ? `${message.body.slice(0, 80)}…` : message.body,
          to: `/messages/${otherId}`,
        })
      }
    })

    s.on('message:read', () => {
      refreshInbox()
      queryClient.invalidateQueries({ queryKey: ['thread'] })
    })

    const refreshNotifications = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] })
    }
    s.on('notification:new', ({ notification: n }) => {
      refreshNotifications()
      toast({
        title: `${displayName(n.actor)} ${describeNotification(n)}`,
        body: n.excerpt,
        to: n.recipe ? `/recipes/${n.recipe._id}` : '/notifications',
      })
    })
    s.on('notification:changed', refreshNotifications)

    setSocket(s)
    return () => {
      s.disconnect()
      setSocket(null)
    }
  }, [token, userId, queryClient, toast])

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

// Subscribes the current page to a recipe's room (live comments) while mounted.
// Re-joins after reconnects, since rooms are lost when a socket drops.
export function useRecipeRoom(recipeId) {
  const socket = useContext(SocketContext)
  useEffect(() => {
    if (!socket || !recipeId) return
    const join = () => socket.emit('recipe:join', recipeId)
    join()
    socket.on('connect', join)
    return () => {
      socket.off('connect', join)
      socket.emit('recipe:leave', recipeId)
    }
  }, [socket, recipeId])
}
