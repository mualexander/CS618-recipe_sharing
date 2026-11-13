import { Link, useNavigate, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRecipe, updateRecipe } from '../api/recipes.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { RecipeForm } from '../components/RecipeForm.jsx'

export function EditRecipePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: recipe, isPending, isError, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipe(id),
  })

  const mutation = useMutation({
    mutationFn: (data) => updateRecipe(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['recipe', id], updated)
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate(`/recipes/${id}`)
    },
  })

  if (isPending) return <p className="muted">Loading…</p>
  if (isError) return <p className="error">{error.message}</p>
  // The server enforces ownership too; this just avoids showing a form that would fail.
  if (recipe.author._id !== user.id) {
    return (
      <div className="empty">
        <p>You can only edit your own recipes.</p>
        <Link to={`/recipes/${id}`}>Back to recipe</Link>
      </div>
    )
  }

  return (
    <>
      <h1>Edit recipe</h1>
      <RecipeForm
        initialRecipe={recipe}
        submitLabel="Save changes"
        onSubmit={mutation.mutate}
        isSubmitting={mutation.isPending}
        serverError={mutation.error}
      />
      <p>
        <Link to={`/recipes/${id}`}>Cancel</Link>
      </p>
    </>
  )
}
