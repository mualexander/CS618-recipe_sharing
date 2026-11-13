import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { deleteComment } from '../services/social.js'

export const commentsRouter = Router()

commentsRouter.delete('/:id', requireAuth, async (req, res) => {
  await deleteComment(req.auth, req.params.id)
  res.sendStatus(204)
})
