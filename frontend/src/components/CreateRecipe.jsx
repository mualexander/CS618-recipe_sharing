import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRecipe } from '../api/recipes.js'

const splitLines = (text) =>
  text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

export function CreateRecipe() {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [instructions, setInstructions] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      setTitle('')
      setIngredients('')
      setInstructions('')
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({ title, author, ingredients: splitLines(ingredients), instructions })
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h2>Share a recipe</h2>
      <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <input placeholder="Your name" value={author} onChange={(e) => setAuthor(e.target.value)} />
      <textarea
        placeholder="Ingredients (one per line)"
        rows={4}
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
      />
      <textarea
        placeholder="Instructions"
        rows={4}
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
      />
      <button type="submit" disabled={!title || mutation.isPending}>
        {mutation.isPending ? 'Saving…' : 'Share'}
      </button>
      {mutation.isError && <p className="error">{mutation.error.message}</p>}
    </form>
  )
}
