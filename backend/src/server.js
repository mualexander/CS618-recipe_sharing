import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { createApp } from './app.js'
import { initDatabase } from './db/init.js'

const PORT = process.env.PORT || 3001

const io = new Server({
  cors: { origin: process.env.CORS_ORIGIN?.split(',') ?? '*' },
})

io.on('connection', (socket) => {
  console.info('socket connected:', socket.id)
  socket.on('disconnect', () => console.info('socket disconnected:', socket.id))
})

const app = createApp(io)
const server = createServer(app)
io.attach(server)

try {
  await initDatabase(process.env.DATABASE_URL)
  server.listen(PORT, () => {
    console.info(`backend listening on http://localhost:${PORT}`)
  })
} catch (err) {
  console.error('failed to start:', err.message)
  process.exit(1)
}
