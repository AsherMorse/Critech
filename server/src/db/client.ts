import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { config } from 'dotenv'

config()

// Validate required database configuration
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing ${envVar} in environment variables`);
  }
}

// Initialize postgres.js client
const client = postgres({
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT!),
  database: process.env.DB_NAME!,
  username: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  ssl: 'require',
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
})

// Create Drizzle ORM instance
const db = drizzle(client, { schema })

export { db, client }