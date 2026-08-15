import express from 'express'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { DATABASE_DIR, LOGS_DIR, PUBLIC_DIR } from './core/paths.mjs'
import { loadConfig } from './core/config.mjs'
import { log } from './core/logger.mjs'
import { migrateAll } from './core/migrator.mjs'

const app = express()

// ---------------------------------------------------------------------------
// Ensure required runtime directories exist on fresh install
// ---------------------------------------------------------------------------
for (const dir of [DATABASE_DIR, LOGS_DIR]) {
  fs.mkdirSync(dir, { recursive: true })
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
try {
  await migrateAll()
} catch (error) {
  log('server', 'error', `Failed to run migrations: ${error}`)
  process.exit(1)
}

let config
try {
  config = loadConfig()
  log('server', 'info', `Configuration loaded: ${JSON.stringify(config)}`)
} catch (error) {
  log('server', 'error', `Failed to load configuration files: ${error}`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// 301 canonical redirect: /*.html → /* (preserves query string)
app.use((req, res, next) => {
  if (!req.path.endsWith('.html')) return next()
  const cleanPath = req.path === '/index.html' ? '/' : req.path.slice(0, -5)
  if (!fs.existsSync(path.join(PUBLIC_DIR, req.path))) return next()
  const qs = req.url.slice(req.path.length)
  return res.redirect(301, cleanPath + qs)
})

app.use(express.static(PUBLIC_DIR, { extensions: ['html'] }))
app.use(express.json())

// Expose shared dependencies to feature routers via app.locals
app.locals.config = config

// ---------------------------------------------------------------------------
// Mount feature routers
// ---------------------------------------------------------------------------
// Feature domains live in server/features/<domain>/router.mjs and are mounted
// here as they are added.

// ---------------------------------------------------------------------------
// Routes that remain in server.mjs (not yet migrated to a feature domain)
// ---------------------------------------------------------------------------

// Health/readiness endpoint — used by the restart-server and debug-server skills.
app.get('/status', (req, res) => {
  res.json({ ok: true, uptime: process.uptime() })
})

// ---------------------------------------------------------------------------
// Server startup
// ---------------------------------------------------------------------------
async function startServer() {
  const port = config.serverPort || 5000
  app.listen(port, () => {
    const nets = os.networkInterfaces()
    const localIp =
      Object.values(nets)
        .flat()
        .find((n) => n.family === 'IPv4' && !n.internal)?.address ?? 'localhost'
    log('server', 'info', `🌐 Server running at http://${localIp}:${port}`)
  })
}

startServer().catch((error) => {
  log('server', 'error', `Failed to start server: ${error}`)
  process.exit(1)
})
