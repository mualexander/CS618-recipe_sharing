import { useNavigate } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createRecipe } from '../api/recipes.js'
import { RecipeForm } from '../components/RecipeForm.jsx'

export function NewRecipePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: (recipe) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate(`/recipes/${recipe._id}`)
    },
  })

  return (
    <>
      <h1>New recipe</h1>
      <RecipeForm
        submitLabel="Publish recipe"
        onSubmit={mutation.mutate}
        isSubmitting={mutation.isPending}
        serverError={mutation.error}
      />
    </>
  )
}
