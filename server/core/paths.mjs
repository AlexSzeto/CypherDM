/**
 * Centralized path management for the server.
 * All other modules should import paths from here instead of computing them locally.
 */
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Root of the `server/` directory */
export const SERVER_DIR = path.resolve(__dirname, '..')

/** Root of the project (one level above `server/`) */
export const PROJECT_ROOT = path.resolve(SERVER_DIR, '..')

/** Path to `server/database/` */
export const DATABASE_DIR = path.join(SERVER_DIR, 'database')

/** Path to `server/storage/` (generated media) */
export const STORAGE_DIR = path.join(SERVER_DIR, 'storage')

/** Path to `server/logs/` */
export const LOGS_DIR = path.join(SERVER_DIR, 'logs')

/** Path to `server/resource/` (static server-side resources, e.g. schemas) */
export const RESOURCE_DIR = path.join(SERVER_DIR, 'resource')

/** Path to `public/` (static front-end assets) */
export const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public')

/** Path to `config.json` */
export const CONFIG_PATH = path.join(SERVER_DIR, 'config.json')

/** Path to `config.default.json` */
export const DEFAULT_CONFIG_PATH = path.join(SERVER_DIR, 'config.default.json')
