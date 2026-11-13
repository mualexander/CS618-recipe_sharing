import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { signup, login, getUserById } from '../services/users.js'

export const authRouter = Router()

authRouter.post('/signup', async (req, res) => {
  res.status(201).json(await signup(req.body))
})

authRouter.post('/login', async (req, res) => {
  res.json(await login(req.body))
})

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json(await getUserById(req.auth.sub))
})
