import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { searchUsers, getUserById, updateProfile } from '../services/users.js'

export const usersRouter = Router()

usersRouter.get('/', async (req, res) => {
  res.json(await searchUsers(req.query))
})

usersRouter.patch('/me', requireAuth, async (req, res) => {
  res.json(await updateProfile(req.auth.sub, req.body))
})

usersRouter.get('/:id', async (req, res) => {
  res.json(await getUserById(req.params.id))
})
