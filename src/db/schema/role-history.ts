import { index, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './user'

export const RoleHistoryAction = Object.freeze({
	CREATED: 'created',
	UPDATED: 'updated',
	DELETED: 'deleted',
} as const)

export type RoleHistoryAction = (typeof RoleHistoryAction)[keyof typeof RoleHistoryAction]

export const roleHistory = pgTable(
	'role_history',
	{
		id: serial('id').primaryKey(),
		roleId: integer('role_id').notNull(),
		action: text('action').notNull(),
		oldValues: jsonb('old_values'),
		newValues: jsonb('new_values'),
		changedBy: integer('changed_by')
			.notNull()
			.references(() => user.id, { onDelete: 'restrict' }),
		changedAt: timestamp('changed_at').notNull(),
	},
	(table) => [index('role_history_role_id_idx').on(table.roleId)],
)
