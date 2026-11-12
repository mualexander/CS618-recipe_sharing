import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { recipesRouter } from './routes/recipes.js'

export function createApp(io) {
  const app = express()

  app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? '*' }))
  app.use(express.json())

  app.get('/api/v1/health', (req, res) => {
    const dbState = mongoose.connection.readyState === 1 ? 'up' : 'down'
    res.json({ status: 'ok', database: dbState })
  })

  app.use('/api/v1/recipes', recipesRouter(io))

  // Express 5 forwards rejected promises from async handlers here.
  app.use((err, req, res, next) => {
    if (err.name === 'ValidationError' || err.name === 'CastError') {
      return res.status(400).json({ error: err.message })
    }
    console.error(err)
    res.status(500).json({ error: 'internal server error' })
  })

  return app
}
