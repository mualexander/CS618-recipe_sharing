import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listConversations, getThread, sendMessage, markThreadRead } from '../api/messages.js'
import { searchUsers } from '../api/users.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { displayName, timeAgo } from '../lib/format.js'

const MAX_LENGTH = 5000

export function MessagesPage() {
  const { userId } = useParams()
  return (
    <div className={`messages-layout${userId ? ' has-thread' : ''}`}>
      <aside className="conversations">
        <h1>Messages</h1>
        <NewConversation />
        <ConversationList />
      </aside>
      <section className="thread-pane">
        {userId ? (
          <Thread key={userId} userId={userId} />
        ) : (
          <div className="empty thread-empty">
            <p>Select a conversation, or search for someone to message.</p>
          </div>
        )}
      </section>
    </div>
  )
}

function NewConversation() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250)
    return () => clearTimeout(t)
  }, [q])

  const results = useQuery({
    queryKey: ['user-search', debounced],
    queryFn: () => searchUsers(debounced),
    enabled: debounced.length > 0,
  })
  const people = results.data?.filter((u) => u._id !== user.id) ?? []

  return (
    <div className="new-conversation">
      <label htmlFor="user-search" className="visually-hidden">
        Find someone to message
      </label>
      <input
        id="user-search"
        type="search"
        placeholder="Find someone to message…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoComplete="off"
      />
      {debounced && (
        <ul className="user-results">
          {people.map((u) => (
            <li key={u._id}>
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setQ('')
                  navigate(`/messages/${u._id}`)
                }}
              >
                {displayName(u)} <span className="muted small">@{u.username}</span>
              </button>
            </li>
          ))}
          {results.isSuccess && people.length === 0 && (
            <li className="muted small">No one found.</li>
          )}
        </ul>
      )}
    </div>
  )
}

function ConversationList() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: listConversations,
  })
  const { user } = useAuth()

  if (isPending) return <p className="muted">Loading…</p>
  if (isError) return <p className="error">{error.message}</p>
  if (data.length === 0) return <p className="muted small">No conversations yet.</p>

  return (
    <ul className="conversation-list">
      {data.map((c) => (
        <li key={c.user._id}>
          <NavLink to={`/messages/${c.user._id}`} className="conversation">
            <span className="conversation-top">
              <strong>{displayName(c.user)}</strong>
              <span className="muted small">{timeAgo(c.lastMessage.createdAt)}</span>
            </span>
            <span className="conversation-bottom">
              <span className={`preview${c.unread ? ' unread' : ''}`}>
                {c.lastMessage.from === user.id && 'You: '}
                {c.lastMessage.body}
              </span>
              {c.unread > 0 && <span className="badge">{c.unread}</span>}
            </span>
          </NavLink>
        </li>
      ))}
    </ul>
  )
}

function Thread({ userId }) {
  const { user: me } = useAuth()
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')
  const bottomRef = useRef(null)
  const key = ['thread', userId]

  const { data, isPending, isError, error } = useQuery({
    queryKey: key,
    queryFn: () => getThread(userId),
  })

  const markRead = useMutation({
    mutationFn: () => markThreadRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['messages-unread'] })
    },
  })

  const unreadFromThem = data?.messages.some((m) => m.from === userId && !m.readAt)
  const messageCount = data?.messages.length ?? 0
  useEffect(() => {
    if (unreadFromThem && !markRead.isPending) markRead.mutate()
  }, [unreadFromThem, messageCount]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messageCount])

  const send = useMutation({
    mutationFn: (text) => sendMessage(userId, text),
    onSuccess: (message) => {
      queryClient.setQueryData(key, (old) =>
        old && !old.messages.some((m) => m._id === message._id)
          ? { ...old, messages: [...old.messages, message] }
          : old,
      )
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setBody('')
    },
  })

  const trimmed = body.trim()
  const canSend = trimmed && body.length <= MAX_LENGTH && !send.isPending
  const submit = (e) => {
    e.preventDefault()
    if (canSend) send.mutate(trimmed)
  }

  if (isPending) return <p className="muted thread-status">Loading…</p>
  if (isError) {
    return (
      <div className="empty thread-empty">
        <p>{error.status === 404 ? 'User not found.' : error.message}</p>
        <Link to="/messages">Back to messages</Link>
      </div>
    )
  }

  const lastMine = [...data.messages].reverse().find((m) => m.from === me.id)

  return (
    <>
      <header className="thread-header">
        <Link to="/messages" className="back-link" aria-label="Back to conversations">
          ←
        </Link>
        <Link to={`/users/${data.user._id}`}>
          <strong>{displayName(data.user)}</strong>
        </Link>
        <span className="muted small">@{data.user.username}</span>
      </header>

      <ol className="message-list">
        {data.messages.length === 0 && (
          <li className="muted center small">Say hello to {displayName(data.user)}.</li>
        )}
        {data.messages.map((m) => (
          <li key={m._id} className={`message ${m.from === me.id ? 'mine' : 'theirs'}`}>
            <span className="bubble" title={new Date(m.createdAt).toLocaleString()}>
              {m.body}
            </span>
            {m === lastMine && (
              <span className="muted small receipt">
                {m.readAt ? `Seen ${timeAgo(m.readAt)}` : `Sent ${timeAgo(m.createdAt)}`}
              </span>
            )}
          </li>
        ))}
        <li ref={bottomRef} aria-hidden="true" />
      </ol>

      <form className="composer" onSubmit={submit}>
        <label htmlFor="message-body" className="visually-hidden">
          Message
        </label>
        <textarea
          id="message-body"
          rows={2}
          placeholder="Write a message… (Enter to send, Shift+Enter for a new line)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) submit(e)
          }}
        />
        <button type="submit" disabled={!canSend}>
          {send.isPending ? 'Sending…' : 'Send'}
        </button>
      </form>
      {body.length > MAX_LENGTH && (
        <p className="error small">Messages can be at most {MAX_LENGTH} characters.</p>
      )}
      {send.isError && (
        <p className="error small">{send.error.fields?.body || send.error.message}</p>
      )}
    </>
  )
}
