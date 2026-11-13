import { Link, useNavigate, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRecipe, deleteRecipe } from '../api/recipes.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { RecipeImage } from '../components/RecipeImage.jsx'

const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { dateStyle: 'medium' })

export function RecipePage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: recipe, isPending, isError, error } = useQuery({
    queryKey: ['recipe', id],
    queryFn: () => getRecipe(id),
  })

  const remove = useMutation({
    mutationFn: () => deleteRecipe(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['recipe', id] })
      queryClient.invalidateQueries({ queryKey: ['recipes'] })
      navigate(user ? `/users/${user.id}` : '/')
    },
  })

  if (isPending) return <p className="muted">Loading…</p>
  if (isError) {
    return (
      <div className="empty">
        <p>{error.status === 404 ? 'This recipe does not exist or was deleted.' : error.message}</p>
        <Link to="/">Back to recipes</Link>
      </div>
    )
  }

  const isOwner = user?.id === recipe.author?._id
  const handleDelete = () => {
    if (window.confirm(`Delete "${recipe.title}"? This cannot be undone.`)) remove.mutate()
  }

  return (
    <article className="recipe-detail">
      <RecipeImage src={recipe.imageUrl} alt={recipe.title} className="hero" />

      <header className="recipe-detail-header">
        <div>
          <h1>{recipe.title}</h1>
          <p className="muted">
            by{' '}
            <Link to={`/users/${recipe.author._id}`}>
              {recipe.author.displayName || `@${recipe.author.username}`}
            </Link>{' '}
            · {formatDate(recipe.createdAt)}
            {recipe.updatedAt !== recipe.createdAt && ` · edited ${formatDate(recipe.updatedAt)}`}
          </p>
        </div>
        {isOwner && (
          <div className="owner-actions">
            <Link to={`/recipes/${id}/edit`} className="button secondary">
              Edit
            </Link>
            <button className="danger" onClick={handleDelete} disabled={remove.isPending}>
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
      </header>
      {remove.isError && <p className="error">{remove.error.message}</p>}

      {recipe.description && <p className="lead">{recipe.description}</p>}
      {recipe.tags?.length > 0 && (
        <ul className="tags">
          {recipe.tags.map((t) => (
            <li key={t}>
              <Link to={`/?tag=${encodeURIComponent(t)}`}>{t}</Link>
            </li>
          ))}
        </ul>
      )}

      <div className="recipe-columns">
        <section>
          <h2>Ingredients</h2>
          <ul className="ingredient-list">
            {recipe.ingredients.map((i, idx) => (
              <li key={idx}>
                {i.quantity && <span className="qty">{i.quantity}</span>} {i.name}
              </li>
            ))}
          </ul>
        </section>
        {recipe.instructions && (
          <section>
            <h2>Instructions</h2>
            <div className="instructions">{recipe.instructions}</div>
          </section>
        )}
      </div>
    </article>
  )
}
