import { Link, useLocation } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { likeRecipe, unlikeRecipe, rateRecipe, removeRating } from '../api/social.js'

// Optimistically patches the cached recipe, rolling back if the request fails.
function useRecipeMutation(recipeId, mutationFn, patch) {
  const queryClient = useQueryClient()
  const key = ['recipe', recipeId]
  return useMutation({
    mutationFn,
    onMutate: async (arg) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData(key)
      if (previous) queryClient.setQueryData(key, patch(previous, arg))
      return { previous }
    },
    onError: (err, arg, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous)
    },
    onSuccess: (res) => {
      queryClient.setQueryData(key, (old) => old && { ...old, stats: res.stats })
    },
  })
}

export function LikeButton({ recipe, signedIn }) {
  const location = useLocation()
  const liked = Boolean(recipe.viewer?.liked)
  const toggle = useRecipeMutation(
    recipe._id,
    (nextLiked) => (nextLiked ? likeRecipe(recipe._id) : unlikeRecipe(recipe._id)),
    (old, nextLiked) => ({
      ...old,
      viewer: { ...old.viewer, liked: nextLiked },
      stats: {
        ...old.stats,
        likes: Math.max(0, old.stats.likes + (nextLiked ? 1 : -1)),
      },
    }),
  )

  const label = `${recipe.stats.likes} like${recipe.stats.likes === 1 ? '' : 's'}`
  if (!signedIn) {
    return (
      <Link to="/login" state={{ from: location }} className="like-button" title="Log in to like">
        <span aria-hidden="true">♡</span> {label}
      </Link>
    )
  }
  return (
    <button
      type="button"
      className={`like-button${liked ? ' liked' : ''}`}
      aria-pressed={liked}
      onClick={() => toggle.mutate(!liked)}
      disabled={toggle.isPending}
    >
      <span aria-hidden="true">{liked ? '♥' : '♡'}</span> {label}
    </button>
  )
}

export function Stars({ value, size = 'normal' }) {
  const rounded = Math.round(value * 2) / 2
  return (
    <span className={`stars ${size}`} aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={rounded >= n ? 'on' : rounded >= n - 0.5 ? 'half' : ''}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </span>
  )
}

export function RatingControl({ recipe, signedIn, isOwner }) {
  const location = useLocation()
  const { ratingAvg, ratingCount } = recipe.stats
  const mine = recipe.viewer?.rating ?? null

  const rate = useRecipeMutation(
    recipe._id,
    (value) => (value ? rateRecipe(recipe._id, value) : removeRating(recipe._id)),
    (old, value) => ({ ...old, viewer: { ...old.viewer, rating: value } }),
  )

  const summary = ratingCount ? (
    <span className="rating-summary">
      <Stars value={ratingAvg} /> {ratingAvg.toFixed(1)}{' '}
      <span className="muted">
        ({ratingCount} rating{ratingCount === 1 ? '' : 's'})
      </span>
    </span>
  ) : (
    <span className="muted">No ratings yet</span>
  )

  let action = null
  if (!signedIn) {
    action = (
      <Link to="/login" state={{ from: location }} className="small">
        Log in to rate
      </Link>
    )
  } else if (!isOwner) {
    action = (
      <span className="rate-input">
        <span className="muted small">{mine ? 'Your rating:' : 'Rate:'}</span>
        <span className="star-buttons" role="radiogroup" aria-label="Your rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={mine === n}
              aria-label={`${n} star${n === 1 ? '' : 's'}`}
              className={mine >= n ? 'on' : ''}
              onClick={() => rate.mutate(n)}
              disabled={rate.isPending}
            >
              ★
            </button>
          ))}
        </span>
        {mine && (
          <button
            type="button"
            className="link-button small"
            onClick={() => rate.mutate(null)}
            disabled={rate.isPending}
          >
            Clear
          </button>
        )}
      </span>
    )
  }

  return (
    <div className="rating">
      {summary}
      {action}
      {rate.isError && <span className="error small">{rate.error.message}</span>}
    </div>
  )
}
