import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteRecipe } from '../api/recipes.js'

export function RecipeList({ recipes }) {
  const queryClient = useQueryClient()
  const remove = useMutation({
    mutationFn: deleteRecipe,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recipes'] }),
  })

  if (recipes.length === 0) return <p>No recipes yet. Be the first to share one!</p>

  return (
    <ul className="recipe-list">
      {recipes.map((r) => (
        <li key={r._id} className="card">
          <h3>{r.title}</h3>
          {r.author && <p className="muted">by {r.author}</p>}
          {r.ingredients?.length > 0 && (
            <ul>
              {r.ingredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          )}
          {r.instructions && <p>{r.instructions}</p>}
          <button className="secondary" onClick={() => remove.mutate(r._id)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}
