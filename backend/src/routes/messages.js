import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listConversations,
  getThread,
  sendMessage,
  markThreadRead,
  unreadCount,
} from '../services/messages.js'

export const messagesRouter = Router()
messagesRouter.use(requireAuth)

messagesRouter.get('/', async (req, res) => {
  res.json(await listConversations(req.auth.sub))
})

messagesRouter.get('/unread', async (req, res) => {
  res.json({ count: await unreadCount(req.auth.sub) })
})

messagesRouter.get('/:userId', async (req, res) => {
  res.json(await getThread(req.auth.sub, req.params.userId, req.query))
})

messagesRouter.post('/:userId', async (req, res) => {
  res.status(201).json(await sendMessage(req.auth.sub, req.params.userId, req.body?.body))
})

messagesRouter.post('/:userId/read', async (req, res) => {
  res.json(await markThreadRead(req.auth.sub, req.params.userId))
})
