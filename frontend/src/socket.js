import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from './auth/AuthContext.jsx'

// Opens one Socket.IO connection per session (same origin; Vite and nginx
// proxy /socket.io to the backend) and keeps cached recipe data fresh when
// anyone creates, edits, or deletes a recipe.
export function useRealtime() {
  const { token } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = io({ auth: token ? { token } : {} })

    const refreshLists = () => queryClient.invalidateQueries({ queryKey: ['recipes'] })
    const refreshOne = ({ recipeId }) => {
      refreshLists()
      queryClient.invalidateQueries({ queryKey: ['recipe', String(recipeId)] })
    }

    socket.on('recipe:created', refreshLists)
    socket.on('recipe:updated', refreshOne)
    socket.on('recipe:deleted', refreshOne)

    return () => socket.disconnect()
  }, [token, queryClient])
}
