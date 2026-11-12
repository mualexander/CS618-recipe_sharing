import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { socket } from './socket.js'

// Refetch the recipe list whenever any client creates, updates, or deletes one.
export function useRecipeEvents() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['recipes'] })
    const events = ['recipe:created', 'recipe:updated', 'recipe:deleted']
    events.forEach((e) => socket.on(e, invalidate))
    return () => events.forEach((e) => socket.off(e, invalidate))
  }, [queryClient])
}
