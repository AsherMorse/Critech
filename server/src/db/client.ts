import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { config } from 'dotenv'

config()

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}

// Initialize postgres.js client
const client = postgres(process.env.DATABASE_URL, { 
  prepare: false,  // Disable prepare statements for Supabase pooler
  ssl: 'require',
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
})

// Create Drizzle ORM instance
const db = drizzle(client, { schema })

export { db, client } 