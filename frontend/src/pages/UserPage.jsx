import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getUser } from '../api/users.js'
import { listRecipes } from '../api/recipes.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { RecipeGrid, Pagination } from '../components/RecipeGrid.jsx'

export function UserPage() {
  const { id } = useParams()
  const { user: me } = useAuth()
  const [page, setPage] = useState(1)
  const isMe = me?.id === id

  const profile = useQuery({ queryKey: ['user', id], queryFn: () => getUser(id) })
  const recipes = useQuery({
    queryKey: ['recipes', { author: id, page }],
    queryFn: () => listRecipes({ author: id, page, limit: 12 }),
    placeholderData: keepPreviousData,
  })

  if (profile.isError) {
    return <p className="error">{profile.error.status === 404 ? 'User not found.' : profile.error.message}</p>
  }

  const name = profile.data?.displayName || (profile.data ? `@${profile.data.username}` : '')

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{isMe ? 'My recipes' : name}</h1>
          {profile.data && (
            <p className="muted">
              @{profile.data.username}
              {recipes.data && ` · ${recipes.data.total} recipe${recipes.data.total === 1 ? '' : 's'}`}
            </p>
          )}
          {profile.data?.bio && <p>{profile.data.bio}</p>}
        </div>
        {isMe && (
          <Link to="/recipes/new" className="button">
            + New recipe
          </Link>
        )}
      </div>
      <RecipeGrid
        query={recipes}
        empty={
          isMe ? (
            <p>
              You haven't shared any recipes yet. <Link to="/recipes/new">Create your first one.</Link>
            </p>
          ) : (
            <p>No recipes yet.</p>
          )
        }
      />
      <Pagination page={page} pages={recipes.data?.pages} onChange={setPage} />
    </>
  )
}
