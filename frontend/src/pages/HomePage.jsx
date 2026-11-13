import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { listRecipes } from '../api/recipes.js'
import { RecipeGrid, Pagination } from '../components/RecipeGrid.jsx'
import { useAuth } from '../auth/AuthContext.jsx'

const SORTS = { newest: 'Newest', oldest: 'Oldest', title: 'A–Z' }

export function HomePage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const sort = params.get('sort') ?? 'newest'
  const tag = params.get('tag') ?? ''
  const page = Number(params.get('page')) || 1

  // Debounce typing into the URL so every keystroke isn't a request.
  const [search, setSearch] = useState(q)
  useEffect(() => setSearch(q), [q])
  useEffect(() => {
    if (search === q) return
    const t = setTimeout(() => update({ q: search, page: '' }), 300)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line react-hooks/exhaustive-deps

  function update(changes) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next, { replace: true })
  }

  const query = useQuery({
    queryKey: ['recipes', { q, sort, tag, page }],
    queryFn: () => listRecipes({ q, sort, tag, page, limit: 12 }),
    placeholderData: keepPreviousData,
  })

  return (
    <>
      <div className="page-header">
        <h1>Recipes</h1>
        {user && (
          <Link to="/recipes/new" className="button">
            + New recipe
          </Link>
        )}
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by title, ingredient, or tag…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search recipes"
        />
        <select value={sort} onChange={(e) => update({ sort: e.target.value, page: '' })} aria-label="Sort">
          {Object.entries(SORTS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {tag && (
        <p className="active-filter">
          Tagged <strong>{tag}</strong>{' '}
          <button className="link-button" onClick={() => update({ tag: '', page: '' })}>
            clear
          </button>
        </p>
      )}

      <RecipeGrid
        query={query}
        empty={
          q || tag ? (
            <p>No recipes match your search.</p>
          ) : (
            <p>
              No recipes yet.{' '}
              {user ? <Link to="/recipes/new">Share the first one!</Link> : <Link to="/signup">Sign up to share one.</Link>}
            </p>
          )
        }
      />
      <Pagination page={page} pages={query.data?.pages} onChange={(p) => update({ page: String(p) })} />
    </>
  )
}
