import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { role } from './role';

export const user = pgTable('user', {
	id: serial('id').primaryKey(),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	email: text('email').notNull().unique(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
	enabled: boolean('enabled').default(true),
	deleted: boolean('deleted').default(false),
});

export const userRole = pgTable(
	'user_role',
	{
		id: serial('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		roleId: integer('role_id')
			.notNull()
			.references(() => role.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at').defaultNow(),
	},
	(table) => ({
		userRoleUnique: unique().on(table.userId, table.roleId),
	}),
);

export const userRelations = relations(user, ({ many }) => ({
	roles: many(userRole),
}));

export const userRoleRelations = relations(userRole, ({ one }) => ({
	user: one(user, { fields: [userRole.userId], references: [user.id] }),
	role: one(role, { fields: [userRole.roleId], references: [role.id] }),
}));
