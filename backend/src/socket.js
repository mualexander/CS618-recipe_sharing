import { Server } from 'socket.io'
import mongoose from 'mongoose'
import { config } from './config.js'
import { verifyToken } from './middleware/auth.js'
import { attachIo, rooms } from './realtime.js'

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, { cors: { origin: config.corsOrigin } })

  // Anonymous sockets are allowed (they receive public feed updates).
  // A valid token also joins the user's private room for targeted events.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next()
    try {
      const { sub, username } = verifyToken(token)
      socket.data.user = { sub, username }
      next()
    } catch {
      next(new Error('invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const user = socket.data.user
    if (user) socket.join(rooms.user(user.sub))

    // Detail pages join a per-recipe room to receive its comment stream.
    socket.on('recipe:join', (recipeId) => {
      if (mongoose.isValidObjectId(recipeId)) socket.join(rooms.recipe(recipeId))
    })
    socket.on('recipe:leave', (recipeId) => {
      if (mongoose.isValidObjectId(recipeId)) socket.leave(rooms.recipe(recipeId))
    })
  })

  attachIo(io)
  return io
}
