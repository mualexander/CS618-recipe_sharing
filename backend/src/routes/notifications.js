import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listNotifications,
  unreadNotificationCount,
  markNotificationsRead,
} from '../services/notifications.js'

export const notificationsRouter = Router()
notificationsRouter.use(requireAuth)

notificationsRouter.get('/', async (req, res) => {
  res.json(await listNotifications(req.auth.sub, req.query))
})

notificationsRouter.get('/unread', async (req, res) => {
  res.json({ count: await unreadNotificationCount(req.auth.sub) })
})

// Body `{ ids: [...] }` marks specific notifications; no ids marks all.
notificationsRouter.post('/read', async (req, res) => {
  res.json(await markNotificationsRead(req.auth.sub, req.body?.ids))
})
