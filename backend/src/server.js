import { createServer } from 'node:http'
import { config, assertConfig } from './config.js'
import { createApp } from './app.js'
import { createSocketServer } from './socket.js'
import { initDatabase } from './db/init.js'

try {
  assertConfig()
  await initDatabase(config.databaseUrl)

  const server = createServer(createApp())
  createSocketServer(server)

  server.listen(config.port, () => {
    console.info(`backend listening on http://localhost:${config.port}`)
  })
} catch (err) {
  console.error('failed to start:', err.message)
  process.exit(1)
}
