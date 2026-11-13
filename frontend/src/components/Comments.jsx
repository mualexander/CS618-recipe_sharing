import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listComments, addComment, deleteComment } from '../api/social.js'
import { useAuth } from '../auth/AuthContext.jsx'

const MAX_LENGTH = 2000

const formatTime = (d) =>
  new Date(d).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

export function Comments({ recipeId }) {
  const { user } = useAuth()
  const location = useLocation()
  const queryClient = useQueryClient()
  const key = ['comments', recipeId]
  const [body, setBody] = useState('')

  const {
    data: comments,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: key,
    queryFn: () => listComments(recipeId),
  })

  // The server also pushes comment:created to everyone viewing this recipe;
  // both paths dedupe by id, so whichever arrives first wins.
  const insert = (comment) =>
    queryClient.setQueryData(key, (old = []) =>
      old.some((c) => c._id === comment._id) ? old : [comment, ...old],
    )

  const add = useMutation({
    mutationFn: (text) => addComment(recipeId, text),
    onSuccess: (comment) => {
      insert(comment)
      setBody('')
    },
  })

  const remove = useMutation({
    mutationFn: deleteComment,
    onSuccess: (_, commentId) =>
      queryClient.setQueryData(key, (old) => old?.filter((c) => c._id !== commentId)),
  })

  const trimmed = body.trim()
  const handleSubmit = (e) => {
    e.preventDefault()
    if (trimmed && trimmed.length <= MAX_LENGTH) add.mutate(trimmed)
  }

  return (
    <section className="comments">
      <h2>Comments{comments?.length ? ` (${comments.length})` : ''}</h2>

      {user ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <label htmlFor="comment-body" className="visually-hidden">
            Add a comment
          </label>
          <textarea
            id="comment-body"
            rows={3}
            placeholder="Share a tip, a substitution, or how it turned out…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="comment-form-footer">
            <span className={`small ${body.length > MAX_LENGTH ? 'error' : 'muted'}`}>
              {body.length}/{MAX_LENGTH}
            </span>
            <button type="submit" disabled={!trimmed || body.length > MAX_LENGTH || add.isPending}>
              {add.isPending ? 'Posting…' : 'Post comment'}
            </button>
          </div>
          {add.isError && (
            <p className="error small">{add.error.fields?.body || add.error.message}</p>
          )}
        </form>
      ) : (
        <p className="muted">
          <Link to="/login" state={{ from: location }}>
            Log in
          </Link>{' '}
          to join the conversation.
        </p>
      )}

      {isPending && <p className="muted">Loading comments…</p>}
      {isError && <p className="error">{error.message}</p>}
      {comments?.length === 0 && <p className="muted">No comments yet.</p>}

      <ul className="comment-list">
        {comments?.map((c) => (
          <li key={c._id} className="comment">
            <div className="comment-meta">
              <Link to={`/users/${c.author?._id}`}>
                {c.author?.displayName || `@${c.author?.username ?? 'deleted'}`}
              </Link>
              <span className="muted small">{formatTime(c.createdAt)}</span>
              {user?.id === c.author?._id && (
                <button
                  type="button"
                  className="link-button small"
                  onClick={() => window.confirm('Delete this comment?') && remove.mutate(c._id)}
                  disabled={remove.isPending}
                >
                  Delete
                </button>
              )}
            </div>
            <p className="comment-body">{c.body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
