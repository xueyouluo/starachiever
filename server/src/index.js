import process from 'node:process'
import { loadConfig } from './config.js'
import { openDatabase, createRepository } from './database.js'
import { createServer } from './server.js'

try {
  process.loadEnvFile?.()
} catch {
  // .env is optional; production deployments can provide real environment variables.
}

const config = loadConfig()
const db = openDatabase(config.databasePath)
const repository = createRepository(db)
const app = createServer({ config, repository })

try {
  await app.listen({ port: config.port, host: config.host })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
