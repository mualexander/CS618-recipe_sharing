import { useQuery } from '@tanstack/react-query'
import { getRecipes } from './api/recipes.js'
import { useRecipeEvents } from './useRecipeEvents.js'
import { CreateRecipe } from './components/CreateRecipe.jsx'
import { RecipeList } from './components/RecipeList.jsx'

export function App() {
  useRecipeEvents()
  const { data: recipes, isPending, isError, error } = useQuery({
    queryKey: ['recipes'],
    queryFn: getRecipes,
  })

  return (
    <main>
      <h1>Recipe Sharing</h1>
      <CreateRecipe />
      <h2>Recipes</h2>
      {isPending && <p>Loading…</p>}
      {isError && <p className="error">{error.message}</p>}
      {recipes && <RecipeList recipes={recipes} />}
    </main>
  )
}
