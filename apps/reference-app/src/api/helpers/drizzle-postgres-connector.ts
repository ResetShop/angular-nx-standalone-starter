import { environment } from '@resetshop/hono-core'
import { schema } from '@schema/all'
import { drizzle } from 'drizzle-orm/node-postgres'

const { connectionString } = environment.database.pg

// Initialize Drizzle with schema for relational query API support
export const drizzlePgConnector = drizzle(connectionString, { schema })

// Type export for DI container
export type DrizzlePgConnector = typeof drizzlePgConnector
