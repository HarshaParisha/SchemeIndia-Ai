import http from 'http'

import dotenv from 'dotenv'

import { createApp } from './app.js'
import { connectMongo } from './utils/mongo.js'
import { initSocket } from './services/socketService.js'
import { seedRoomsIfEmpty } from './utils/seedRooms.js'
import { ensureSchemesSeed } from './utils/ensureSchemesSeed.js'

dotenv.config()

const PORT = Number(process.env.PORT || 5000)

async function main() {
  ensureSchemesSeed(30)
  await connectMongo(process.env.MONGODB_URI)
  await seedRoomsIfEmpty()

  const app = createApp()
  const server = http.createServer(app)
  initSocket(server)

  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
