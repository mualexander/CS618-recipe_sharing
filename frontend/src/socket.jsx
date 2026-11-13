import { createContext, useContext, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './auth/AuthContext.jsx'

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
  const { token } = useAuth()
  const queryClient = useQueryClient()
  const [socket, setSocket] = useState(null)

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

    setSocket(s)
    return () => {
      s.disconnect()
      setSocket(null)
    }
  }, [token, queryClient])

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
