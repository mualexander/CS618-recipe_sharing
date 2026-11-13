import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { config } from './config.js'
import { errorHandler } from './middleware/errors.js'
import { authRouter } from './routes/auth.js'
import { usersRouter } from './routes/users.js'
import { recipesRouter } from './routes/recipes.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: config.corsOrigin }))
  app.use(express.json({ limit: '100kb' }))

  app.get('/api/v1/health', (req, res) => {
    const database = mongoose.connection.readyState === 1 ? 'up' : 'down'
    res.json({ status: 'ok', database })
  })

  app.use('/api/v1/auth', authRouter)
  app.use('/api/v1/users', usersRouter)
  app.use('/api/v1/recipes', recipesRouter)

  app.use('/api', (req, res) => res.status(404).json({ error: 'not found' }))
  app.use(errorHandler)

  return app
}
