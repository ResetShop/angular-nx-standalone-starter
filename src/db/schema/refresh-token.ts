import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './user';

export const refreshToken = pgTable('refresh_token', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	tokenFamily: text('token_family').notNull(),
	tokenHash: text('token_hash').notNull().unique(),
	expiresAt: timestamp('expires_at').notNull(),
	isRevoked: boolean('is_revoked').default(false),
	createdAt: timestamp('created_at').defaultNow(),
	revokedAt: timestamp('revoked_at'),
});
