import { RecipeCard } from './RecipeCard.jsx'

export function RecipeGrid({ query, empty }) {
  if (query.isPending) return <p className="muted">Loading recipes…</p>
  if (query.isError) return <p className="error">{query.error.message}</p>
  if (query.data.items.length === 0) return <div className="empty">{empty}</div>
  return (
    <div className="recipe-grid">
      {query.data.items.map((r) => (
        <RecipeCard key={r._id} recipe={r} />
      ))}
    </div>
  )
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null
  return (
    <div className="pagination">
      <button className="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Previous
      </button>
      <span className="muted">
        Page {page} of {pages}
      </span>
      <button className="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next →
      </button>
    </div>
  )
}
