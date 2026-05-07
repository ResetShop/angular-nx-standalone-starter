import { environment } from '@resetshop/hono-core'
import { schema } from '@schema/all'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'

const { connectionString } = environment.database.pg

export const drizzlePgConnector = drizzle(connectionString, { schema })
export type DrizzlePgConnector = NodePgDatabase<typeof schema>
