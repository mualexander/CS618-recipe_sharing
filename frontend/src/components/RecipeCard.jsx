import { Link } from 'react-router'
import { RecipeImage } from './RecipeImage.jsx'

export function RecipeCard({ recipe }) {
  return (
    <article className="recipe-card">
      <Link to={`/recipes/${recipe._id}`} className="recipe-card-link">
        <RecipeImage src={recipe.imageUrl} alt={recipe.title} />
        <div className="recipe-card-body">
          <h3>{recipe.title}</h3>
          <p className="muted small">
            by {recipe.author?.displayName || recipe.author?.username || 'unknown'} ·{' '}
            {recipe.ingredients.length} ingredient
            {recipe.ingredients.length === 1 ? '' : 's'}
          </p>
          {recipe.stats && (
            <p className="card-stats small muted">
              <span title="Likes">♥ {recipe.stats.likes}</span>
              <span title="Average rating">
                ★ {recipe.stats.ratingCount ? recipe.stats.ratingAvg.toFixed(1) : '–'}
                {recipe.stats.ratingCount > 0 && ` (${recipe.stats.ratingCount})`}
              </span>
              <span title="Comments">💬 {recipe.stats.comments}</span>
            </p>
          )}
          {recipe.tags?.length > 0 && (
            <ul className="tags">
              {recipe.tags.slice(0, 4).map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      </Link>
    </article>
  )
}
